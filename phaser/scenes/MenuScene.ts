import * as Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  private startKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("menu");
    console.log("[MenuScene] constructor");
  }

  create() {
    console.log("[MenuScene] create()");
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, "Press ENTER to Start", {
      fontSize: "28px",
      color: "#fff",
    }).setOrigin(0.5);

    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.startKey)) {
      console.log("[MenuScene] ENTER pressed → starting PlayScene");
      this.scene.start("play");
    }
  }
}
