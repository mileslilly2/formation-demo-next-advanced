import * as Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  private startKey!: Phaser.Input.Keyboard.Key;

  // ✅ add these
      private lastTap = 0;
      private readonly DOUBLE_TAP_DELAY = 300;

      constructor() {
        super("menu");
        console.log("[MenuScene] constructor");
      }

    create() {
      console.log("[MenuScene] create()");
      const { width, height } = this.scale;

      this.add.text(
    width / 2,
    height / 2,
    "Press ENTER or Double-Tap to Start",
    {
      fontSize: "28px",
      color: "#fff",
      align: "center",
      wordWrap: {
        width: width * 0.8, // 👈 critical
        useAdvancedWrap: true,
      },
    }
  ).setOrigin(0.5);

    // keyboard
    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    // ✅ mobile double-tap
    this.input.on("pointerdown", () => {
      const now = this.time.now;

      if (now - this.lastTap < this.DOUBLE_TAP_DELAY) {
        console.log("[MenuScene] double tap → starting PlayScene");
        this.scene.start("play");
      }

      this.lastTap = now;
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.startKey)) {
      console.log("[MenuScene] ENTER pressed → starting PlayScene");
      this.scene.start("play");
    }
  }
}
