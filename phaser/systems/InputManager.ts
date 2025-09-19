// phaser/systems/InputManager.ts
import * as Phaser from "phaser";
import Player from "../entities/Player";
import Bullet from "../entities/Bullet";

export default class InputManager {
  private scene: Phaser.Scene;
  private player: Player;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireCooldown = 0;
  private bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Player, bullets: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.bullets = bullets;
    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  update(delta: number) {
    const dt = delta / 1000;
    const speed = 280;

    const vx =
      (this.cursors.left?.isDown ? -1 : 0) +
      (this.cursors.right?.isDown ? 1 : 0);
    const vy =
      (this.cursors.up?.isDown ? -1 : 0) +
      (this.cursors.down?.isDown ? 1 : 0);

    this.player.setVelocity(vx * speed, vy * speed);

    this.fireCooldown -= dt;
    if (
      (this.cursors.space?.isDown || this.scene.input.activePointer.isDown) &&
      this.fireCooldown <= 0
    ) {
      this.fireCooldown = 0.15;
      this.player.fire(this.bullets); // reuse the shared pool
    }
  }
}
