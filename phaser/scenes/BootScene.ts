// phaser/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Adjust paths to your public/ folder if necessary
    this.load.image('bg', '/sprites/pillars_of_creation.png');

    // If you have an atlas, enable these lines and ensure the JSON exists:
    // this.load.atlas('insects', '/sprites/insect_shapes_sheet.png', '/sprites/insect_shapes_sheet.json');

    // Example: preload a sample formation if you want (optional)
    // this.load.json('sine_test', '/formations/sine_test.json');
  }

  create() {
    this.scene.start('menu');
  }
}
