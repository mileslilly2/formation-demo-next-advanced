import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Load a simple background texture or fallback color
    this.load.image('bg', '/sprites/bg.png'); // make sure /public/sprites/bg.png exists
    this.load.atlas('flares', '/sprites/flares.png', '/sprites/flares.json'); // optional
  }

  create() {
    console.log('[BootScene] create');
    // Immediately go to menu
    this.scene.start('menu');
  }
}
