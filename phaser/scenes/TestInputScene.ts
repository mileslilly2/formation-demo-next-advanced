// phaser/scenes/TestInputScene.ts
import * as Phaser from "phaser";

export default class TestInputScene extends Phaser.Scene {
  constructor() {
    super("test-input");
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, "Tap / Click anywhere", {
      fontSize: "24px",
      color: "#fff",
    }).setOrigin(0.5);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      console.log("[TestInputScene] pointerdown at", p.x, p.y);
    });

    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      console.log("[TestInputScene] pointerup at", p.x, p.y);
    });
  }
}
