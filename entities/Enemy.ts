import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, texture?: string, frame?: string | number) {
    super(scene, x, y, texture as any, frame as any);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  initDisplay(size = 48) {
    this.setDisplaySize(size, size);
    this.setCircle(Math.min(this.width, this.height) * 0.4);
  }
}
