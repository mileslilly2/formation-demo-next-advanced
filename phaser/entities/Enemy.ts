import * as Phaser from "phaser";;
import Bullet from './Bullet';

let nextEnemyId = 1;

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  id: number;
  hp: number;
  fireTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, undefined as any);
    this.id = nextEnemyId++;
    this.hp = 1;
  }

  init(id: number, x: number, y: number, vx: number, vy: number, size: number, hp: number) {
    this.id = id;
    this.hp = hp;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.setDisplaySize(size, size);
    this.setVelocity(vx, vy);
    this.setCircle(size * 0.4);
  }

  startFiring(scene: Phaser.Scene, bulletGroup: Phaser.Physics.Arcade.Group) {
    if (this.fireTimer) this.fireTimer.remove();

    this.fireTimer = scene.time.addEvent({
      delay: Phaser.Math.Between(800, 1600),
      loop: true,
      callback: () => {
        if (!this.active) return;
        const b = bulletGroup.get(this.x, this.y + 20) as Bullet;
        if (!b) return;
        b.init(this.x, this.y + 20, 0, 200, 'enemy_basic', 'enemy');
      },
    });
  }

  stopFiring() {
    if (this.fireTimer) {
      this.fireTimer.remove();
      this.fireTimer = undefined;
    }
  }

  receiveDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.kill();
      return true;
    }
    return false;
  }

  kill() {
    this.stopFiring();
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
    this.body.enable = false;
  }
}
