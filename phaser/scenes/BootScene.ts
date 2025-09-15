import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    // adjust filenames if your assets are named differently
    this.load.image('bg', '/sprites/pillars_of_creation.png');

    // if you have an atlas:
    // this.load.atlas('insects', '/sprites/insect_shapes_sheet.png', '/sprites/insect_shapes_sheet.json');
  }

  create() {
    this.scene.start('menu');
  }
}
