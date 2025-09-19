// phaser/entities/Enemy.ts
import * as Phaser from 'phaser';
import Bullet from './Bullet';

let nextEnemyId = 1;

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  id: number;
  hp: number;
  fireTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy');

    // attach to scene + physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.id = nextEnemyId++;
    this.hp = 1;

    this.setDisplaySize(40, 40);
    this.setActive(false);
    this.setVisible(false);
  }

  /** initialize/reuse enemy */
  init(
    id: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    hp: number
  ) {
    this.id = id;
    this.hp = hp;

    this.setPosition(x, y);
    this.setVelocity(vx, vy);

    this.setDisplaySize(size, size);
    this.setCircle(size * 0.4);

    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
  }

  /** enemy autofire */
  startFiring(scene: Phaser.Scene, bulletGroup: Phaser.Physics.Arcade.Group) {
    if (this.fireTimer) this.fireTimer.remove();

    this.fireTimer = scene.time.addEvent({
      delay: Phaser.Math.Between(800, 1600),
      loop: true,
      callback: () => {
        if (!this.active) return;

        const b = bulletGroup.get(this.x, this.y + 20) as Bullet;
        if (!b) return;

        // always init with owner + damage
        b.init(this.x, this.y + 20, 0, 200, 'bullet', 'enemy', 1);
      },
    });
  }

  stopFiring() {
    if (this.fireTimer) {
      this.fireTimer.remove();
      this.fireTimer = undefined;
    }
  }

  /** handle taking damage */
  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.kill();
      return true;
    }
    return false;
  }

  /** deactivate + recycle enemy */
  kill() {
    this.stopFiring();
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
    this.body.enable = false;
  }
}
