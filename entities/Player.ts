import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture?: string, frame?: string | number) {
    super(scene, x, y, texture as any, frame as any);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
  }

  // small convenience wrapper for setting size
  initDisplay(width: number, height: number) {
    this.setDisplaySize(width, height);
    this.setCircle(Math.min(width, height) / 2.8);
  }
}
