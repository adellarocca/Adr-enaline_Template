import * as Phaser from 'phaser';
import { GameOptions } from './constants/gameOptions';
import BootScene from './scenes/bootScene';
import PreloaderScene from './scenes/preloaderScene';
import SettingsScene from './scenes/settingsScene'
import GameScene from './scenes/gameScene';
import { AUTO, Game } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GameOptions.gameSize.width,
        height: GameOptions.gameSize.height  
    },
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [BootScene, PreloaderScene, SettingsScene, GameScene],
    physics : {
    default: 'arcade',
    arcade : {
            debug : GameOptions.debugMode
        }
    }    
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
