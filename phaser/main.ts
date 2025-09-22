// main.ts
import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import PlayScene from "./scenes/PlayScene";
import PauseOverlayScene from "./scenes/PauseOverlayScene";

console.log("BootScene import is:", BootScene);
console.log("MenuScene import is:", MenuScene);
console.log("PlayScene import is:", PlayScene);
console.log("PauseOverlayScene import is:", PauseOverlayScene);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: "arcade" },
  scene: [BootScene, MenuScene, PlayScene, PauseOverlayScene],
};

new Phaser.Game(config);
