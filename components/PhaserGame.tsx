"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

import PlayScene from "../phaser/scenes/PlayScene";



export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: { default: "arcade" },
        scene: [PlayScene],   // 👈 now using your real scene
        parent: "phaser-container",
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
        width: "800px",
        height: "600px",
        margin: "0 auto",
        border: "2px solid #444",
      }}
    />
  );
}
