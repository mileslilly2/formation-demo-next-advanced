// phaser/scenes/PauseOverlayScene.ts
import * as Phaser from "phaser";

export default class PauseOverlayScene extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("pauseOverlay");
  }

  create() {
    console.log("[PauseOverlay] create() called");
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
    this.add
      .text(width / 2, height / 2, "⏸️ Paused\nPress ESC to resume", {
        fontSize: "28px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5);

    this.escKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    console.log("[PauseOverlay] ESC key registered:", this.escKey);

    console.log(
      "[PauseOverlay] Active scenes at create:",
      this.scene.manager.scenes.map(s => ({
        key: s.scene.key,
        isActive: this.scene.isActive(s.scene.key),
        isPaused: this.scene.isPaused(s.scene.key),
        isVisible: s.scene.settings.visible,
      }))
    );
  }

  update() {
    // Optional frame-by-frame log if you need to check activity
    // console.log("[PauseOverlay] update tick");

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      console.log("[PauseOverlay] ESC pressed → resuming PlayScene");

      this.scene.stop("pauseOverlay");
      console.log("[PauseOverlay] pauseOverlay stopped");

      this.scene.resume("play");
      console.log("[PauseOverlay] PlayScene resumed");

      console.log(
        "[PauseOverlay] Active scenes after resume:",
        this.scene.manager.scenes.map(s => ({
          key: s.scene.key,
          isActive: this.scene.isActive(s.scene.key),
          isPaused: this.scene.isPaused(s.scene.key),
          isVisible: s.scene.settings.visible,
        }))
      );
    }
  }
}
