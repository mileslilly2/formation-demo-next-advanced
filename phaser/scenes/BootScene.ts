import * as Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    console.log("[BootScene] constructor");
  }

  preload() {
    console.log("[BootScene] preload()");
    this.load.image("bg", "sprites/bg.png"); // make sure /public/sprites/bg.png exists
    this.load.atlas("flares", "sprites/flares.png", "sprites/flares.json");
  }

  create() {
    console.log("[BootScene] create()");
    this.scene.start("menu");
  }
}
