import * as Phaser from "phaser";;

export default class Bullet extends Phaser.Physics.Arcade.Image {
  owner: 'player' | 'enemy';
  damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, undefined as any);
    this.owner = 'player';
    this.damage = 1;
  }

  init(x: number, y: number, vx: number, vy: number, type: string, owner: 'player' | 'enemy') {
    this.owner = owner;
    this.damage = 1;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.setDisplaySize(10, 16);
    this.setVelocity(vx, vy);
  }

  kill() {
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
    this.body.enable = false;
  }
}
