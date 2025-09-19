import * as Phaser from "phaser";

export default class LevelSelectScene extends Phaser.Scene {
  private levels = ["level1.json", "level2.json"]; // extend as needed

  constructor() {
    super("level-select");
  }

  preload() {
    this.load.image("bg", "/sprites/bg.png");
  }

  create() {
    const { width, height } = this.scale;

    // background
    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);

    this.add.text(width / 2, 80, "Select Level", {
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // render level list as menu options
    this.levels.forEach((level, idx) => {
      const y = 160 + idx * 60;
      const text = this.add
        .text(width / 2, y, level.replace(".json", ""), {
          fontSize: "24px",
          color: "#00ffcc",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on("pointerover", () => text.setColor("#ffff00"));
      text.on("pointerout", () => text.setColor("#00ffcc"));
      text.on("pointerdown", () => {
        console.log(`[LevelSelectScene] Selected ${level}`);
        this.scene.start("play", { levelFile: level });
      });
    });
  }
}
