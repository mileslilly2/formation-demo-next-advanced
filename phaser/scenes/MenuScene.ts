import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private startKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('menu');
  }

  create() {
    console.log('[MenuScene] create');
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, 'Press ENTER to Start', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.startKey)) {
      this.scene.start('play');
    }
  }
}
