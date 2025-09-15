import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  eid!: number;
  hp!: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy'); // replace 'enemy' with your texture key
  }

  init(eid: number, x: number, y: number, vx: number, vy: number, size: number, hp: number) {
    this.eid = eid;
    this.hp = hp;

    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setDisplaySize(size, size);
    this.setVelocity(vx, vy);
    this.setCircle(size / 2);
  }

  /** Apply damage and return true if enemy died */
  receiveDamage(dmg: number): boolean {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.kill();
  }

  kill() {
    this.disableBody(true, true);
    this.setActive(false);
    this.setVisible(false);
  }
}
