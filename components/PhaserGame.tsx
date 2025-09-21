"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

import PlayScene from "../phaser/scenes/PlayScene";
import MenuScene from "../phaser/scenes/MenuScene";
import BootScene from "../phaser/scenes/BootScene";
import PauseOverlayScene from "../phaser/scenes/PauseOverlayScene";



export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "phaser-container",
  backgroundColor: "#000000",
  physics: { default: "arcade" },
  scene: [BootScene, MenuScene, PlayScene, PauseOverlayScene],
  scale: {
    mode: Phaser.Scale.RESIZE,          // resizes with parent div
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: { pixelArt: true, roundPixels: true },
   // 👇 force-enable inputs
        input: {
          keyboard: true,
          mouse: true,
          touch: true,
          gamepad: false,
        },
};


      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      // clean up on unmount
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
   <div
  id="phaser-container"
  style={{
    width: "100vw",
    height: "100vh",
    margin: "0",
    padding: "0",
    overflow: "hidden",
    pointerEvents: "auto",
    touchAction: "none", // 👈 prevent touch scrolling
  }}
/>

  );
}
