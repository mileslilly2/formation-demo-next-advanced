// phaser/systems/InputManager.ts
import * as Phaser from 'phaser';
import Player from '../entities/Player';

export default class InputManager {
  private scene: Phaser.Scene;
  private player: Player;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireCooldown = 0;
  private pointerDown = false; // track if touch/mouse is held down

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.cursors = scene.input.keyboard.createCursorKeys();

    // Pointer/touch handling
    this.scene.input.on('pointerdown', () => {
      this.pointerDown = true;
    });

    this.scene.input.on('pointerup', () => {
      this.pointerDown = false;
    });
  }

  /**
   * Update movement + shooting each frame
   * @param delta - time step (ms)
   * @param bullets - shared bullet group from PlayScene
   */
  update(delta: number, bullets: Phaser.Physics.Arcade.Group) {
    const dt = delta / 1000;
    const speed = 280;

    // --- Keyboard movement ---
    const vx =
      (this.cursors.left?.isDown ? -1 : 0) +
      (this.cursors.right?.isDown ? 1 : 0);
    const vy =
      (this.cursors.up?.isDown ? -1 : 0) +
      (this.cursors.down?.isDown ? 1 : 0);

    this.player.setVelocity(vx * speed, vy * speed);

    // --- Pointer drag movement ---
    if (this.pointerDown && this.scene.input.activePointer) {
      const p = this.scene.input.activePointer;
      this.player.x = Phaser.Math.Clamp(p.x, 0, this.scene.scale.width);
      this.player.y = Phaser.Math.Clamp(p.y, 0, this.scene.scale.height);
    }

    // --- Shooting (space OR touch/hold) ---
    this.fireCooldown -= dt;
    if (
      (this.cursors.space?.isDown || this.pointerDown) &&
      this.fireCooldown <= 0
    ) {
      this.fireCooldown = 0.15;
      this.player.fire(bullets);
    }
  }
}
