import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number = 1;
  owner: string = 'player';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet'); // replace 'bullet' with your texture key
  }

  init(x: number, y: number, vx: number, vy: number, type: string, owner: string) {
    this.owner = owner;
    this.damage = 1; // you can set per type
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setDisplaySize(12, 18);
    this.setVelocity(vx, vy);
    this.setCircle(6);
  }

  kill() {
    this.disableBody(true, true);
    this.setActive(false);
    this.setVisible(false);
  }
}
