# How this game fills the screen

This guide explains the display code in this template. It is written for someone who is new to Phaser. You do not need to know the whole engine. You do need to know that a Phaser game is a canvas, and that scenes place images with `x` and `y`.

The design comes from [Understanding Phaser's EXPAND scale mode](https://emanueleferonato.com/2026/10/09/understanding-phasers-expand-scale-mode/).

## The problem

A game drawn at 640 by 1050 pixels does not match every window. A laptop is wide. A phone is tall.

The old `Scale.FIT` mode kept the canvas at 640 by 1050 and scaled that rectangle into the window. The empty strips on the sides, or above and below, were black bars (or whatever color the page used).

`Scale.EXPAND` removes those bars. The canvas grows on the long side until it covers the window. The game you designed stays the same size. Only the area around it changes.

## Two rulers

The display uses two coordinate systems. Keep them separate. Mixing them is the usual source of bugs.

| Name | Where to read it | What it means |
| --- | --- | --- |
| Game pixels | `scene.scale.width`, `scene.scale.height` | The canvas size chosen by EXPAND. It changes when the window changes. |
| World units | `stage.width`, `stage.height` | The stage you designed: 640 by 1050. Buttons, text, and gameplay use only these numbers. |

Phaser decides how many pixels the canvas has. The camera decides which part of the world you see, and how big that part looks. Gameplay never reads the window size.

```ts
import { stage } from '../stage';

// The center of the designed stage. This stays 320, 525 on every device.
const title = this.add.sprite(stage.centerX, stage.centerY - 50, 'title');
```

`stage` lives in `src/game/stage.ts`. It is a fixed object:

```ts
export const stage = {
    width: 640,
    height: 1050,
    centerX: 320,
    centerY: 525,
} as const;
```

`as const` tells TypeScript these numbers never change. If you try to write `stage.width = 800`, the compiler stops you. That is deliberate. The stage is the design. The window is not.

The same numbers are also the EXPAND base size, in `src/game/constants/gameOptions.ts`:

```ts
gameSize: {
    width: 640,
    height: 1050,
}
```

`stage.ts` copies them once at startup. Scenes import `stage`. They do not import the config just to find the center of the screen.

## What EXPAND does to the canvas

Open `src/game/main.ts`. The important lines are:

```ts
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GameOptions.gameSize.width,
    height: GameOptions.gameSize.height,
    parent: 'game-container',
    backgroundColor: GameOptions.backdropColor,
    canvasStyle: 'display: block; touch-action: none;',
    scale: {
        mode: Phaser.Scale.EXPAND,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // ...
};
```

`width` and `height` sit on the game config itself, not inside `scale`. EXPAND reads them from `game.config` and treats them as the base size, not as the final canvas.

Each time the window changes, Phaser compares the parent element (`#game-container`) with that base:

```text
scaleX = parentWidth / 640
scaleY = parentHeight / 1050
```

The smaller factor wins, the same way `FIT` would. The matching side stays at the base size. The other side grows so the canvas fills the parent instead of leaving a bar.

```text
scaleX < scaleY  →  width = 640,   height = parentHeight / scaleX
scaleY < scaleX  →  height = 1050, width  = parentWidth / scaleY
```

The canvas is never smaller than 640 by 1050. One side is exactly the base. The other side is equal or larger. Phaser then stretches that canvas with CSS until it covers the parent.

Two sizes measured in the browser:

| Window (CSS pixels) | Canvas (game pixels) |
| --- | --- |
| 940 × 638, a wide window | 1547 × 1050 |
| 390 × 760, a tall phone | 640 × 1247 |

A scene reads the result with `this.scale.width` and `this.scale.height`. Phaser emits `Phaser.Scale.Events.RESIZE` whenever those values change.

## What the camera does

The canvas can be wider or taller than 640 by 1050. The camera's job is to keep the designed stage on screen, and to share the extra room equally on both sides.

`layoutStage(gameWidth, gameHeight)` does the math and nothing else. It does not move the camera. That makes it easy to read: numbers in, a `StageLayout` out.

With `stageMargin` at 0, the zoom is:

```text
zoom = min(gameWidth / 640, gameHeight / 1050)
```

Because EXPAND already kept one side equal to the base, this zoom is 1. One world unit is one game pixel. CSS does the visual scaling after that. The formula stays in the code so a future margin can shrink the stage without a rewrite. `GameOptions.stageMargin` is that margin, in world units.

`applyStageLayout(scene)` is the function that touches the camera. Phaser has already resized the camera before our code runs, so this function only sets three things:

- the background color, `#ededed` (`GameOptions.backdropColor`), which matches the hex pattern
- `setZoom(layout.worldScale)`
- `centerOn(stage.centerX, stage.centerY)`, which is `centerOn(320, 525)`

On a wide window you see more pattern to the left and to the right. On a tall phone you see more pattern above and below. Buttons and text stay inside the 640 by 1050 rectangle, so they stay in the central column on a large screen. That is intentional. This interface belongs to the stage. It is not a HUD glued to the window corner.

The visible rectangle, in world units, can extend past the stage. The top and the left can be negative:

```text
left   = -areaOffsetX / zoom
top    = -areaOffsetY / zoom
width  = gameWidth / zoom
height = gameHeight / zoom
```

That rectangle is `layout.visible`. Full-screen pictures use it. Gameplay objects do not.

## One function wires a scene

Scenes do not call `layoutStage` themselves. They call `bindStage`.

```ts
export function bindStage(scene: Phaser.Scene, onLayout?: (layout: StageLayout) => void): void {
    const apply = (): void => {
        onLayout?.(applyStageLayout(scene));
    };

    scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.scale.off(Phaser.Scale.Events.RESIZE, apply);
    });
    apply();
}
```

Read it in order:

1. `apply` frames the camera, then tells the scene the new `layout` if the scene passed a callback.
2. The same function runs on every `RESIZE`.
3. On `SHUTDOWN` the listener is removed. A scene that has already left must not move the camera of the next scene.
4. `apply()` also runs immediately. The first `RESIZE` can fire before `create()`, especially when the scene has a `preload()`. Without this call, the picture would sit in the top-left corner until the player resized the window.

The optional callback is how a scene updates its own pictures without knowing how the zoom was calculated. The scene receives a finished `StageLayout` and uses `layout.visible`.

## Where each scene calls it

| Scene | When | Why |
| --- | --- | --- |
| `BootScene` | Never | It only loads a few images and starts the preloader. It draws nothing, and it does not copy the camera size into `stage`. |
| `PreloaderScene` | At the start of `preload()` | The logo is created before `create()`. The camera has to be centered already, or the logo appears in the corner during loading. |
| `GameScene` | At the end of `create()` | The background and the three veils exist, so `refit` can resize them. |
| `SettingsScene` | At the end of `create()` | Same idea, plus the closed panels are parked under the screen. |

`PreloaderScene` is the short version:

```ts
const background = addStageTile(this, 'background');
bindStage(this, (layout) => fitTile(background, layout.visible));

const logo = this.add.sprite(stage.centerX, stage.centerY - 100, 'logo');
```

The background follows the visible world. The logo stays on the stage.

## Pictures that must cover the whole window

The hex pattern (`background.png`, 1050 by 1050) is not a picture with a fixed frame. It repeats. A `TileSprite` is the Phaser object for that.

`addStageTile(scene, texture)` creates one at the stage size. `fitTile(tile, area)` then moves and resizes it to `layout.visible`:

- position and size match the visible rectangle, which may start at a negative `x` or `y`
- `tilePositionX` and `tilePositionY` are set to that same origin, so the pattern does not slide when the window changes

`fitTiles` does this for several tiles at once. `GameScene.refit` uses it for the background and for the start, pause, and game-over veils. Those veils must cover the pattern around the stage too, not only the 640 by 1050 rectangle. They are tiles of `overlay.png`.

Buttons, the title, the score, and the timer are normal objects placed with `stage.centerX`, `stage.width`, and `stage.height`. `refit` does not move them.

## Panels that slide up from below the screen

The credits panel and the shortcuts panel in `SettingsScene` are containers. Their `y` is 0 when they are open, which covers the screen. When they are closed they wait just below the visible world.

Parking them at `stage.height` (1050) is wrong on a tall phone. The visible world is taller than 1050, so the top of the panel would still be on screen.

Each panel has a background tile named `panel-fill`, created with `addPanelFill`. `fitPanelFill` finds that child by name and runs `fitTile` on it. The container itself is not moved by that function. Only its background grows.

`restPanel(panel, visibleHeight, sliding)` sets `panel.y` to `visible.height` when the panel is closed and is not already tweening. `SettingsScene.refit` skips this while a panel is open (`screenName` is not `'settings'`), and it skips a panel whose tween is still running. Closing a panel tweens it to `this.cameras.main.worldView.height`, which is the same bottom edge after the camera has been framed.

`worldView` is Phaser's name for the rectangle the camera can currently see, in world units. It matches `layout.visible` once the zoom and the scroll have been applied.

## The page has to be the screen

EXPAND measures `#game-container`. If that element is only as tall as the canvas, the page scrolls. `100vh` on iOS also includes the address bar, so the height jumps.

`public/style.css` pins the container to the viewport:

```css
#game-container {
    position: fixed;
    inset: 0;
    touch-action: none;
}
```

`inset: 0` means top, right, bottom, and left are all 0. The container is the screen.

The canvas is `display: block` (set in CSS and in `canvasStyle`), so the browser does not add a line of text under it. `touch-action: none` stops the browser from scrolling or pinch-zooming the page instead of the game.

Inside an iframe, the container fills the iframe and EXPAND adapts to that, the same way it adapts to a window. The keyboard reaches the game after the iframe has focus, which the first click gives it.

## A small map of the files

| File | Its one job |
| --- | --- |
| `src/game/main.ts` | Builds the Phaser game. Turns EXPAND on. Sets the base size. |
| `src/game/constants/gameOptions.ts` | The fixed numbers: stage size, margin, backdrop color, timer, colors. |
| `src/game/stage.ts` | The stage, the camera math, and the helpers that resize tiles and panels. |
| `src/game/scenes/bootScene.ts` | Loads the first images. Does not frame the camera. |
| `src/game/scenes/preloaderScene.ts` | Loading screen. Frames the camera at the start of `preload()`. |
| `src/game/scenes/gameScene.ts` | The game. Frames the camera at the end of `create()`, then refits the full-screen tiles. |
| `src/game/scenes/settingsScene.ts` | Settings. Same framing, plus the sliding panels. |
| `public/style.css` | Makes `#game-container` the screen, so EXPAND has something real to measure. |

Other files (`button.ts`, the sound helpers, the language helpers) are not part of the scale mode. They place objects with the coordinates you give them. Pass `stage` coordinates and they stay on the stage.

## Mistakes that bring the bars back

- Do not resize the camera inside the resize handler. Phaser has already done that. Change the zoom and the scroll only.
- Call `bindStage` once, at the end of `create()`. If the screen is built in `preload()`, call it there instead, before you place the logo.
- Do not move gameplay objects with `scene.scale.width`. That number is the canvas, and it changes. Use `stage`.
- Do not park a closed panel at `stage.height`. That is the bottom of the design, not the bottom of the screen. Use `layout.visible.height` or `camera.worldView.height`.
- Do not remove `position: fixed; inset: 0` from `#game-container`. EXPAND can only fill the parent it is given.
- An object added with `this.add` is zoomed and scrolled with the camera. To pin something to a corner of the window you would place it on the visible rectangle and scale it by `1 / zoom`, or give it a second camera with no zoom. This template does not do that. The interface belongs to the stage.
