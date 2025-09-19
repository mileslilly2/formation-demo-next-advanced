// phaser/scenes/MenuScene.ts
import * as Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  private startKey!: Phaser.Input.Keyboard.Key;
  private selectedMode: 'waves' | 'test' = 'waves';
  private modeTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.25, 'Select Mode', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const modes: ('waves' | 'test')[] = ['waves', 'test'];

    modes.forEach((mode, i) => {
      const text = this.add.text(width / 2, height * 0.4 + i * 40, mode.toUpperCase(), {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      text.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.setSelectedMode(mode);
      });

      this.modeTexts.push(text);
    });

    // Default select "waves"
    this.setSelectedMode('waves');

    // Press ENTER to start
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.add.text(width / 2, height * 0.75, 'Press ENTER to Start', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.startKey)) {
      // Save selected mode in registry
      this.game.registry.set('mode', this.selectedMode);
      this.scene.start('play');
    }
  }

  private setSelectedMode(mode: 'waves' | 'test') {
    this.selectedMode = mode;

    // Update colors to show selected mode
    this.modeTexts.forEach((t) => {
      if (t.text.toLowerCase() === mode) {
        t.setColor('#00ff00'); // highlight selected
      } else {
        t.setColor('#aaaaaa'); // dim unselected
      }
    });

    console.log('[MenuScene] Selected mode:', mode);
  }
}
