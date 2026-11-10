import * as Phaser from 'phaser';
import { GameOptions } from './constants/gameOptions';
import BootScene from './scenes/bootScene';
import PreloaderScene from './scenes/preloaderScene';
import SettingsScene from './scenes/settingsScene';
import GameScene from './scenes/gameScene';

/**
 * Width and height are the EXPAND base size, not the final canvas.
 * Phaser fits the stage into the parent, then grows the canvas on the side
 * that has spare room. Scenes read the result from `this.scale`.
 * The camera, not the canvas, decides how big the stage looks.
 */
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
    scene: [BootScene, PreloaderScene, SettingsScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: GameOptions.debugMode,
        },
    },
};

const startGame = (parent: string): Phaser.Game => {
    return new Phaser.Game({ ...config, parent });
};

export default startGame;
