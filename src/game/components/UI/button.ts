import * as Phaser from 'phaser';
import { GameOptions } from '../../constants/gameOptions';

export default class Button extends Phaser.GameObjects.Image {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    callback: () => void,
    noframes: boolean = false,
    applyThemeTint: boolean = true
  ) {
    // Appeler le constructeur parent
    super(scene, x, y, texture, 0);

    if (applyThemeTint) {
      this.setTint(GameOptions.gameThemeTint.asNumber);
    }

    // Définir les interactions avec la souris
    this.setInteractive({ useHandCursor: true });

    // Gestion des événements
    this.on('pointerup', () => {
      if (!noframes) {
        this.setFrame(1);
      }
    });

    this.on('pointerdown', () => {
      if (!noframes) {
        this.setFrame(2);
      }
      callback.call(scene);
    });

    this.on('pointerover', () => {
      if (!noframes) {
        this.setFrame(1);
      }
    });

    this.on('pointerout', () => {
      if (!noframes) {
        this.setFrame(0);
      }
    });

    // Ajouter le bouton à la scène
    scene.add.existing(this);
  }
}