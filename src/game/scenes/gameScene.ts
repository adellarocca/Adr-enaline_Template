import * as Phaser from 'phaser';
import { GameOptions } from '../constants/gameOptions';
import GameParameters from  '../Shared/gameParameters';
import Button from '../components/UI/button';
import GameHelpers from '../Shared/gameHelpers';
import LocalStorageHelpers from '../Shared/localStorageHelpers';
import LanguageHelpers from '../Shared/languageHelpers';
import SFXHelpers from '../Shared/sFXHelpers';


export default class GameScene extends Phaser.Scene {
    
    private buttonDummy!: Button;
    private screenPausedBack! : Button;
    private screenPausedContinue! : Button;
    private buttonPause! : Button;
	private startButtonPlay!: Button;
	private startButtonSettings!: Button;
	private startGroup!: Phaser.GameObjects.Group;
	private startBg!: Phaser.GameObjects.Sprite;
    private screenGameoverBack! : Button;
    private screenGameoverRestart! : Button;

    private textTime! : Phaser.GameObjects.Text;
    private currentTimer! : Phaser.Time.TimerEvent;
	private moveTimer! : Phaser.Time.TimerEvent;
	private textHighscore!: Phaser.GameObjects.Text;
    private textScore! : Phaser.GameObjects.Text;
    private screenGameoverScore! : Phaser.GameObjects.Text;
    private screenPausedGroup! : Phaser.GameObjects.Group;
    private screenGameoverGroup! : Phaser.GameObjects.Group;
    private pointsTween!: Phaser.Tweens.Tween;
    private screenPausedText!: Phaser.GameObjects.Text;
    private screenPausedBg! : Phaser.GameObjects.Sprite;
    private screenGameoverBg! : Phaser.GameObjects.Sprite;
    private screenGameoverText!: Phaser.GameObjects.Text;
	private startTitle!: Phaser.GameObjects.Sprite;

    private stateStatus : string | null = null;
    private score! : number;
    private timeMax! : number;
    private gamePaused! : boolean;
    private runOnce! : boolean;    

    constructor() {
        super('Game');
    };
    create() {
		SFXHelpers.manage('music', 'init', this);
		SFXHelpers.manage('sound', 'init', this);

        this.add.sprite(0, 0, 'background').setOrigin(0,0);
        this.stateStatus = 'start';
        this.score = 0;
        this.timeMax = GameOptions.gameTimeMax;
		this.gamePaused = false;
		this.runOnce = false;

		this.buttonDummy = new Button(this, GameParameters.worldParameters.centerX, GameParameters.worldParameters.centerY, 'clickme', this.addPoints);
        this.buttonDummy.setOrigin(0.5,0.5);
        this.buttonDummy.setAlpha(0);
        this.buttonDummy.setScale(0.1);
        this.tweens.add({targets: this.buttonDummy, alpha: 1, duration: 500, ease: 'Linear'});
        this.tweens.add({targets: this.buttonDummy, scale: 1, duration: 500, ease: 'Back'});
		this.buttonDummy.input!.enabled = false;

		this.moveTimer = this.time.addEvent({
			delay: 2000, // 2 secondes
			callback: this.moveImageToRandomPosition,
			callbackScope: this,
			loop: true
		});
		this.moveTimer.paused = true;
        
        this.initUI();
		this.initStartOverlay();

        this.currentTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeMax--;
                this.textTime.setText(LanguageHelpers.getText('gameplay-timeleft')+this.timeMax);
                if(!this.timeMax) {
                    this.runOnce = false;
                    this.stateStatus = 'gameover';
                }
            },
            callbackScope: this,
            loop: true
        });
		this.currentTimer.paused = true;

		this.input.keyboard!.on('keydown', this.handleKey, this);
        this.cameras.main.fadeIn(250);
    };
	update() {
		switch(this.stateStatus) {
			case 'start': {
				this.stateStart();
				break;
			}
			case 'paused': {
				if(!this.runOnce) {
					this.statePaused();
					this.runOnce = true;
				}
				break;
			}
			case 'gameover': {
				if(!this.runOnce) {
					this.stateGameover();
					this.runOnce = true;
				}
				break;
			}
			case 'playing': {
				this.statePlaying();
				break;
			}
			default:
				break;
		}
	};

	moveImageToRandomPosition() {		
		const buttonSize = this.buttonDummy.width;
		const randomX = Phaser.Math.Between(buttonSize, GameParameters.worldParameters.width - buttonSize); 
		const randomY = Phaser.Math.Between(buttonSize, GameParameters.worldParameters.height - buttonSize); 	
		
		this.buttonDummy.setPosition(randomX, randomY);
	};

    handleKey(e : KeyboardEvent) {
        switch(e.code) {
            case 'Enter': {
				if(this.stateStatus === 'start') {
					this.clickStart();
				}
				else {
					this.addPoints();
				}
                break;
            }
            case 'KeyP': {
                this.managePause();
                break;
            }
            case 'KeyB': {
                this.stateBack();
                break;
            }
            case 'KeyT': {
                this.stateRestart();
                break;
            }
            default:
				break;
        }
    };

	clickStart() {
		SFXHelpers.play('click');
		this.setStartOverlayVisible(false);
		this.startButtonPlay.input!.enabled = false;
		this.startButtonSettings.input!.enabled = false;
		this.buttonPause.input!.enabled = true;
		this.buttonDummy.input!.enabled = true;
		this.currentTimer.paused = false;
		this.moveTimer.paused = false;
		this.stateStatus = 'playing';
		this.runOnce = false;
	}

	clickSettings() {
		SFXHelpers.play('click');
		GameHelpers.fadeOutScene('Settings', this);
	}

    managePause() {
		if(this.stateStatus !== 'playing' && this.stateStatus !== 'paused') {
			return;
		}
        this.gamePaused = !this.gamePaused;
        this.currentTimer.paused = !this.currentTimer.paused;
		this.moveTimer.paused = !this.moveTimer.paused;
		SFXHelpers.play('click');
		if(this.gamePaused) {
			GameHelpers.fadeOutIn(() => {
				this.buttonPause.input!.enabled = false;
				this.buttonDummy.input!.enabled = false;
				this.stateStatus = 'paused';				
			}, this);
            this.runOnce = false;
			this.screenPausedBack.x = -this.screenPausedBack.width-20;
			this.tweens.add({targets: this.screenPausedBack, x: 100, duration: 500, delay: 250, ease: 'Back'});
			this.screenPausedContinue.x = GameParameters.worldParameters.width+this.screenPausedContinue.width+20;
			this.tweens.add({targets: this.screenPausedContinue, x: GameParameters.worldParameters.width-100, duration: 500, delay: 250, ease: 'Back'});
		}
		else {
			GameHelpers.fadeOutIn(() => {
				this.buttonPause.input!.enabled = true;
				this.buttonDummy.input!.enabled = true;
				this.stateStatus = 'playing';				
			}, this);
            this.runOnce = false;
			this.screenPausedBack.x = 100;
			this.tweens.add({targets: this.screenPausedBack, x: -this.screenPausedBack.width-20, duration: 500, ease: 'Back'});
			this.screenPausedContinue.x = GameParameters.worldParameters.width-100;
			this.tweens.add({targets: this.screenPausedContinue, x: GameParameters.worldParameters.width+this.screenPausedContinue.width+20, duration: 500, ease: 'Back'});
        }
    };
	statePlaying() {
        if(this.timeMax === 0) {
            this.runOnce = false;
            this.stateStatus = 'gameover';
        }
	};

	stateStart() {
		// Overlay is already visible; keep gameplay blocked until Play.
	}

	statePaused() {
        this.screenPausedGroup.toggleVisible();
	};

	stateGameover() {
		this.currentTimer.paused = !this.currentTimer.paused;
		this.moveTimer.paused = true;
		LocalStorageHelpers.setHighscore('APT-highscore',this.score);
		GameHelpers.fadeOutIn(() => {
			this.screenGameoverGroup.toggleVisible();			
			this.buttonPause.input!.enabled = false;
			this.buttonDummy.input!.enabled = false;
			this.screenGameoverScore.setText(LanguageHelpers.getText('gameplay-score')+this.score);
			this.gameoverScoreTween();
		}, this);
		this.screenGameoverBack.x = -this.screenGameoverBack.width-20;
		this.tweens.add({targets: this.screenGameoverBack, x: 100, duration: 500, delay: 250, ease: 'Back'});
		this.screenGameoverRestart.x = GameParameters.worldParameters.width+this.screenGameoverRestart.width+20;
		this.tweens.add({targets: this.screenGameoverRestart, x: GameParameters.worldParameters.width-100, duration: 500, delay: 250, ease: 'Back'});
	};

    initUI() {
		this.buttonPause = new Button(this, 20, 20, 'button-pause', this.managePause);
		this.buttonPause.setOrigin(0,0);
		this.buttonPause.input!.enabled = false;

		LocalStorageHelpers.initUnset('APT-highscore', 0);
		const rawHighscore = LocalStorageHelpers.get('APT-highscore');
		const highscore = typeof rawHighscore === 'number' ? rawHighscore : Number(rawHighscore ?? 0) || 0;

		var fontScore = { font: '38px '+ LanguageHelpers.getText('FONT'), fill: '#D63384', stroke: '#000', strokeThickness: 5 };
		var fontScoreWhite =  { font: '38px '+ LanguageHelpers.getText('FONT'), fill: '#000', stroke: '#D63384', strokeThickness: 5 };

		this.textHighscore = this.add.text(
			GameParameters.worldParameters.width - 30,
			45,
			LanguageHelpers.getText('menu-highscore') + highscore,
			fontScore
		);
		this.textHighscore.setOrigin(1, 0);

		this.textScore = this.add.text(GameParameters.worldParameters.width-30, 95, LanguageHelpers.getText('gameplay-score')+this.score, fontScore);
		this.textScore.setOrigin(1,0);

		this.textHighscore.y = -this.textHighscore.height-20;
		this.tweens.add({targets: this.textHighscore, y: 45, duration: 500, delay: 100, ease: 'Back'});

		this.textScore.y = -this.textScore.height-20;
		this.tweens.add({targets: this.textScore, y: 95, duration: 500, delay: 150, ease: 'Back'});

		this.textTime = this.add.text(30, GameParameters.worldParameters.height-30, LanguageHelpers.getText('gameplay-timeleft')+this.timeMax, fontScore);
		this.textTime.setOrigin(0,1);

		this.textTime.y = GameParameters.worldParameters.height+this.textTime.height+30;
		this.tweens.add({targets: this.textTime, y: GameParameters.worldParameters.height-30, duration: 500, ease: 'Back'});		

		this.buttonPause.y = -this.buttonPause.height-20;
        this.tweens.add({targets: this.buttonPause, y: 20, duration: 500, ease: 'Back'});

		var fontTitle = { font: '48px '+ LanguageHelpers.getText('FONT'), fill: '#000', stroke: '#D63384', strokeThickness: 10 };

		this.screenPausedGroup = this.add.group();
        this.screenPausedBg = this.add.sprite(0, 0, 'overlay');
        this.screenPausedBg.setAlpha(0.95);
        this.screenPausedBg.setOrigin(0, 0);
		this.screenPausedText = this.add.text(GameParameters.worldParameters.centerX, 100, LanguageHelpers.getText('gameplay-paused'), fontTitle);
		this.screenPausedText.setOrigin(0.5,0);
		this.screenPausedBack = new Button(this, 100, GameParameters.worldParameters.height-100, 'button-mainmenu', this.stateBack);
		this.screenPausedBack.setOrigin(0,1);
		this.screenPausedContinue = new Button(this, GameParameters.worldParameters.width-100, GameParameters.worldParameters.height-100, 'button-continue', this.managePause);
		this.screenPausedContinue.setOrigin(1,1);
		this.screenPausedGroup.add(this.screenPausedBg);
		this.screenPausedGroup.add(this.screenPausedText);
		this.screenPausedGroup.add(this.screenPausedBack);
		this.screenPausedGroup.add(this.screenPausedContinue);
        this.screenPausedGroup.toggleVisible();

		this.screenGameoverGroup = this.add.group();
        this.screenGameoverBg = this.add.sprite(0, 0, 'overlay');
        this.screenGameoverBg.setAlpha(0.95);
        this.screenGameoverBg.setOrigin(0, 0);
		this.screenGameoverText = this.add.text(GameParameters.worldParameters.centerX, 100, LanguageHelpers.getText('gameplay-gameover'), fontTitle);
		this.screenGameoverText.setOrigin(0.5,0);
		this.screenGameoverBack = new Button(this, 100, GameParameters.worldParameters.height-100, 'button-mainmenu', this.stateBack);
		this.screenGameoverBack.setOrigin(0,1);
		this.screenGameoverRestart = new Button(this, GameParameters.worldParameters.width-100, GameParameters.worldParameters.height-100, 'button-restart', this.stateRestart);
		this.screenGameoverRestart.setOrigin(1,1);
		this.screenGameoverScore = this.add.text(GameParameters.worldParameters.centerX, 300, LanguageHelpers.getText('gameplay-score')+this.score, fontScoreWhite);
		this.screenGameoverScore.setOrigin(0.5,0.5);
		this.screenGameoverGroup.add(this.screenGameoverBg);
		this.screenGameoverGroup.add(this.screenGameoverText);
		this.screenGameoverGroup.add(this.screenGameoverBack);
		this.screenGameoverGroup.add(this.screenGameoverRestart);
		this.screenGameoverGroup.add(this.screenGameoverScore);
		this.screenGameoverGroup.toggleVisible();
    };

	initStartOverlay() {
		this.startGroup = this.add.group();
		this.startBg = this.add.sprite(0, 0, 'overlay');
		this.startBg.setAlpha(0.6);
		this.startBg.setOrigin(0, 0);

		this.startTitle = this.add.sprite(GameParameters.worldParameters.centerX, GameParameters.worldParameters.centerY - 50, 'title');
		this.startTitle.setOrigin(0.5);

		this.startButtonSettings = new Button(this, 20, 20, 'button-settings', this.clickSettings);
		this.startButtonSettings.setOrigin(0, 0);

		this.startButtonPlay = new Button(this, GameParameters.worldParameters.width-20, GameParameters.worldParameters.height-20, 'button-start', this.clickStart);
		this.startButtonPlay.setOrigin(1, 1);

		this.startGroup.add(this.startBg);
		this.startGroup.add(this.startTitle);
		this.startGroup.add(this.startButtonSettings);
		this.startGroup.add(this.startButtonPlay);
	}

	private setStartOverlayVisible(visible: boolean) {
		for(const child of this.startGroup.getChildren()) {
			(child as unknown as { setVisible: (value: boolean) => void }).setVisible(visible);
		}
	}

    addPoints() {
		this.score += 10;
        this.textScore.setText(LanguageHelpers.getText('gameplay-score')+this.score);
        
        var randX = Phaser.Math.Between(200, GameParameters.worldParameters.width-200);
        var randY = Phaser.Math.Between(200, GameParameters.worldParameters.height-200);
        var fontTitle = { font: '48px '+ LanguageHelpers.getText('FONT'), fill: '#D63384', stroke: '#000', strokeThickness: 10 };
		var pointsAdded = this.add.text(randX, randY, '+10', fontTitle);
		pointsAdded.setOrigin(0.5, 0.5);
        this.tweens.add({targets: pointsAdded, alpha: 0, y: randY-50, duration: 1000, ease: 'Linear'});

        this.cameras.main.shake(100, 0.01, true);
    };

	stateRestart() {
		SFXHelpers.play('click');
        GameHelpers.fadeOutScene('Game', this);
	};

	stateBack() {
		SFXHelpers.play('click');
		GameHelpers.fadeOutScene('Game', this);
	};
	
	gameoverScoreTween() {		
		this.screenGameoverScore.setText(LanguageHelpers.getText('gameplay-score')+'0');
		if(this.score) {
			this.pointsTween = this.tweens.addCounter({
				from: 0, to: this.score, duration: 2000, delay: 250,
				callbackScope: this,
				onUpdate: () => {
					this.screenGameoverScore.setText(LanguageHelpers.getText('gameplay-score')+Math.floor(this.pointsTween.getValue() ?? 0));
				},
				onComplete: () => {
					var emitter = this.add.particles(this.screenGameoverScore.x+30, this.screenGameoverScore.y, 'particle', {
						speed: { min: -600, max: 600 },
						angle: { min: 0, max: 360 },
						scale: { start: 0.5, end: 3 },
						blendMode: 'ADD',
						active: true,
						lifespan: 2000,
						gravityY: 1000,
						quantity: 250
					});
					emitter.explode();
				}
			});
		}
	};
};