// phaser/entities/Bullet.ts
import * as Phaser from "phaser";

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  owner: "player" | "enemy" | string;

  constructor(scene: Phaser.Scene, x: number, y: number, texture = "bullet") {
    super(scene, x, y, texture);
    this.damage = 1;
    this.owner = "player";
  }

  /** Initialize / reset the bullet when reused from the group */
  init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    texture = "bullet",
    owner: "player" | "enemy" | string = "player"
  ) {
    this.setTexture(texture);
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.setVelocity(vx, vy);
    this.setDisplaySize(12, 18);

    this.owner = owner;
    this.damage = 1;
  }

  /** Kill the bullet (disable and hide) */
  kill() {
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
    this.body.enable = false;
  }
}
