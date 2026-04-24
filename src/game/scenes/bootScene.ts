import * as Phaser from 'phaser';
import GameParameters from  '../Shared/gameParameters';
import LanguageHelpers from '../Shared/languageHelpers';

export default class BootScene extends Phaser.Scene {

    constructor() {
        super('Boot');

        // const WebFont = require('webfontloader');
        // WebFont.load({
        //     custom: {
        //         families: [ 'Freckle Face']
        //     }
        // });        
    };

    preload() {
        // Resolve assets base against Vite base URL (supports hosting under subpaths).
        // Note: Vite can set BASE_URL to './' (relative) when base: './'
        const appBase = new URL(import.meta.env.BASE_URL || '/', globalThis.location.href);
        const assetsBase = (import.meta.env.VITE_APP_ASSETS_BASE_URL || 'assets/').replace(/^\/?/, '');
        this.load.baseURL = new URL(assetsBase, appBase).toString();
        this.load.image('background', 'background/background.png');
        this.load.image('logo', 'ui/adr-enaline_Logo.png');
        this.load.image('loading-background', 'ui/loading-background.png');
    };

    create() {
        GameParameters.worldParameters = {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            centerX: this.cameras.main.centerX,
            centerY: this.cameras.main.centerY            
        };

        LanguageHelpers.updateLanguage('en');        

        this.scene.start('Preloader');
    };
}