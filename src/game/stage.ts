import * as Phaser from 'phaser';
import { GameOptions } from './constants/gameOptions';

const width = GameOptions.gameSize.width;
const height = GameOptions.gameSize.height;

/**
 * The stage, in world units.
 * Gameplay and interface positions use only these numbers.
 * The canvas size lives on `scene.scale` and changes with the window.
 */
export const stage = {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
} as const;

/** Name of the tile sprite that paints a sliding panel across the visible world. */
export const PANEL_FILL_NAME = 'panel-fill';

/**
 * How the fixed stage sits inside the current game size.
 * Game pixels come from Scale.EXPAND. World units are the stage.
 */
export interface StageLayout {
    /** Game pixels per world unit. This is the main camera zoom. */
    readonly worldScale: number;
    /** Gap between the left of the screen and the stage, in game pixels. */
    readonly areaOffsetX: number;
    /** Gap between the top of the screen and the stage, in game pixels. */
    readonly areaOffsetY: number;
    /** What the screen shows, in world units. The stage stays inside it. */
    readonly visible: Phaser.Geom.Rectangle;
}

/**
 * Largest zoom that keeps the whole stage, margins included, on screen.
 * The calculation only needs the current game size. It does not touch the camera.
 */
export function layoutStage(gameWidth: number, gameHeight: number): StageLayout {
    const margin = GameOptions.stageMargin;
    const requiredWidth = stage.width + margin * 2;
    const requiredHeight = stage.height + margin * 2;
    const worldScale = Math.min(gameWidth / requiredWidth, gameHeight / requiredHeight);

    if (!(worldScale > 0)) {
        return {
            worldScale: 1,
            areaOffsetX: 0,
            areaOffsetY: 0,
            visible: new Phaser.Geom.Rectangle(0, 0, stage.width, stage.height),
        };
    }

    const areaOffsetX = (gameWidth - stage.width * worldScale) / 2;
    const areaOffsetY = (gameHeight - stage.height * worldScale) / 2;
    const visible = new Phaser.Geom.Rectangle(
        -areaOffsetX / worldScale,
        -areaOffsetY / worldScale,
        gameWidth / worldScale,
        gameHeight / worldScale
    );

    return { worldScale, areaOffsetX, areaOffsetY, visible };
}

/**
 * Points the main camera at the stage.
 * Phaser has already resized the camera, so only zoom and scroll change here.
 */
export function applyStageLayout(scene: Phaser.Scene): StageLayout {
    const layout = layoutStage(scene.scale.width, scene.scale.height);
    const camera = scene.cameras.main;
    camera.setBackgroundColor(GameOptions.backdropColor);
    camera.setZoom(layout.worldScale);
    camera.centerOn(stage.centerX, stage.centerY);
    return layout;
}

/**
 * Fits the stage now, and again on every resize.
 * The first RESIZE can arrive before create(), so the handler also runs immediately.
 * The listener is removed when the scene shuts down, so it cannot frame the next scene.
 */
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

/** A tile sprite the size of the stage. `fitTile` stretches it to the visible world. */
export function addStageTile(scene: Phaser.Scene, texture: string): Phaser.GameObjects.TileSprite {
    return scene.add.tileSprite(0, 0, stage.width, stage.height, texture).setOrigin(0, 0);
}

/** Panel background. `fitPanelFill` finds it by name and covers the visible world. */
export function addPanelFill(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
    const fill = addStageTile(scene, 'background');
    fill.setName(PANEL_FILL_NAME);
    return fill;
}

/** Spreads a repeating image across the visible world, stable in world coordinates. */
export function fitTile(tile: Phaser.GameObjects.TileSprite, area: Phaser.Geom.Rectangle): void {
    tile.setOrigin(0, 0);
    tile.setPosition(area.x, area.y);
    tile.setSize(area.width, area.height);
    tile.tilePositionX = area.x;
    tile.tilePositionY = area.y;
}

/** Fits every full-screen tile to the same visible rectangle. */
export function fitTiles(area: Phaser.Geom.Rectangle, tiles: readonly Phaser.GameObjects.TileSprite[]): void {
    for (const tile of tiles) {
        fitTile(tile, area);
    }
}

/** Fits the fill child of a panel that slides in world space. The panel itself stays put. */
export function fitPanelFill(panel: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle): void {
    const fill = panel.getByName(PANEL_FILL_NAME);
    if (fill instanceof Phaser.GameObjects.TileSprite) {
        fitTile(fill, area);
    }
}

/**
 * Parks a closed panel just past the bottom of the visible world.
 * A panel that is already sliding is left alone.
 */
export function restPanel(panel: Phaser.GameObjects.Container, visibleHeight: number, sliding: boolean): void {
    if (!sliding) {
        panel.y = visibleHeight;
    }
}
