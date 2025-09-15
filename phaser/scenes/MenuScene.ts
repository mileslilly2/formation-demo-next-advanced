import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 20, 'Formation Demo (Phaser)', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 16, 'Press SPACE or Click to Start', {
        fontSize: '16px',
        color: '#aaf',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('play');
    });

    this.input.once('pointerdown', () => {
      this.scene.start('play');
    });
  }
}
