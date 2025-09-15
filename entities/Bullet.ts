import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, undefined as any);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  initDisplay() {
    this.setDisplaySize(12, 18);
    this.setCircle(6);
  }

  fire(x: number, y: number, vx = 0, vy = -520) {
    this.enableBody(true, x, y, true, true);
    this.setVelocity(vx, vy);
  }
}
