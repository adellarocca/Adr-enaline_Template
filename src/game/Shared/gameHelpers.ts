import * as Phaser from 'phaser';

export default class GameHelpers {    
    static getRandomInt(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    static fadeOutIn(passedCallback: (scene: Phaser.Scene) => void, scene: Phaser.Scene): void {
      scene.cameras.main.fadeOut(250);
      scene.time.addEvent({
        delay: 250,
        callback: () => {
          scene.cameras.main.fadeIn(250);
          passedCallback(scene);
        },
      });
    };

    static fadeOutScene(nextSceneName: string, scene: Phaser.Scene): void {
      scene.cameras.main.fadeOut(250);
      scene.time.addEvent({
          delay: 250,
          callback: function() {
            scene.scene.start(nextSceneName);
          },
          callbackScope: scene
      });
    };

    static  redirectToExternalSite(url: string) {      
      if (window.top && window.top.location) {
          window.top.location.href = url;
      } else {
          console.warn("Unable to access 'window.top'. Redirecting via 'window.location' instead.");
          window.location.href = url;
      }
    };
  }