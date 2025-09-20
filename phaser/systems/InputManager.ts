// phaser/systems/InputManager.ts
import * as Phaser from 'phaser';
import Player from '../entities/Player';

export default class InputManager {
  private scene: Phaser.Scene;
  private player: Player;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireCooldown = 0;
  private pointerDown = false;
  private debugText!: Phaser.GameObjects.Text; // 👈 overlay text

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.cursors = scene.input.keyboard.createCursorKeys();

    // --- Debug overlay ---
    this.debugText = this.scene.add
      .text(12, this.scene.scale.height - 28, 'TOUCH: UP', {
        fontSize: '14px',
        color: '#ff0',
        backgroundColor: '#000',
      })
      .setDepth(2000);

    // Pointer/touch handlers
    this.scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointerDown = true;
      this.debugText.setText(`TOUCH: DOWN (${Math.floor(p.x)},${Math.floor(p.y)})`);
    });

    this.scene.input.on('pointerup', () => {
      this.pointerDown = false;
      this.debugText.setText('TOUCH: UP');
    });
  }

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
