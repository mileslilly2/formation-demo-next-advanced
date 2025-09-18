// phaser/entities/Bullet.ts
import * as Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  owner: 'player' | 'enemy';
  damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');

    // enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(8, 16);
    this.setActive(false);
    this.setVisible(false);

    this.owner = 'player';
    this.damage = 1;
  }

  /** initialize/reuse bullet from pool */
  init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    texture: string,
    owner: 'player' | 'enemy',
    damage = 1
  ) {
    this.setTexture(texture || 'bullet');
    this.setPosition(x, y);
    this.setVelocity(vx, vy);
    this.setActive(true);
    this.setVisible(true);

    this.owner = owner;
    this.damage = damage;
  }

  /** mark bullet as inactive + recycle */
  kill() {
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
    this.body.enable = false;
  }
}
