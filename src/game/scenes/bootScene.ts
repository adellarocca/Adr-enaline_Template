import * as Phaser from 'phaser';
import LanguageHelpers from '../Shared/languageHelpers';

export default class BootScene extends Phaser.Scene {

    constructor() {
        super('Boot');
    };

    preload() {
        const assetsBase = (import.meta.env.VITE_APP_ASSETS_BASE_URL as string) || 'assets/';
        this.load.baseURL = `${import.meta.env.BASE_URL}${assetsBase}`;
        this.load.image('background', 'background/background.png');
        this.load.image('logo', 'ui/adr-enaline_Logo.png');
        this.load.image('loading-background', 'ui/loading-background.png');
    };

    create() {
        LanguageHelpers.updateLanguage('en');
        this.scene.start('Preloader');
    };
}