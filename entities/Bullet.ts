// phaser/entities/Bullet.ts
import * as Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number = 1;
  owner: 'player' | 'enemy' | string = 'player';

  constructor(scene: Phaser.Scene, x = 0, y = 0, texture = 'bullet') {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).enable = false;
    }
  }

  /**
   * Initialize or reuse a pooled bullet.
   */
  init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    texture = 'bullet',
    owner: 'player' | 'enemy' | string = 'player',
    damage = 1
  ) {
    this.setTexture(texture);
    this.setPosition(x, y);
    this.setDisplaySize(12, 18);
    this.owner = owner;
    this.damage = damage;

    if (this.body && (this.body as Phaser.Physics.Arcade.Body).reset) {
      (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
      (this.body as Phaser.Physics.Arcade.Body).enable = true;
    }

    this.setActive(true);
    this.setVisible(true);
    this.setVelocity(vx, vy);
  }

  /**
   * Kill the bullet — returns to pool. Use disableBody to hide + disable physics.
   */
  kill() {
    if (this.body && (this.body as Phaser.Physics.Arcade.Body).enable) {
      try {
        this.disableBody(true, true);
      } catch {
        this.setActive(false);
        this.setVisible(false);
        (this.body as any).stop && (this.body as any).stop();
        (this.body as any).enable = false;
      }
    } else {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
