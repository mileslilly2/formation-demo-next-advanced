'use client';
import React, { useEffect, useRef } from 'react';
import type PhaserType from 'phaser';

// Import scenes (they export classes)
import { BootScene } from '../phaser/scenes/BootScene';
import { MenuScene } from '../phaser/scenes/MenuScene';
import { PlayScene } from '../phaser/scenes/PlayScene';

type Props = { selectedFile?: string };

export default function PhaserGame({ selectedFile }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const Phaser = (await import('phaser')).default;

      if (!mounted || !rootRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: rootRef.current.clientWidth || 800,
        height: rootRef.current.clientHeight || 600,
        parent: rootRef.current,
        backgroundColor: '#061025',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false,
          },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [BootScene, MenuScene, PlayScene],
      };

      gameRef.current = new Phaser.Game(config);
    })();

    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Forward selectedFile changes into Phaser as an event
  useEffect(() => {
    if (selectedFile && gameRef.current) {
      (gameRef.current as any).events.emit('formation:selected', selectedFile);
    }
  }, [selectedFile]);

  return <div ref={rootRef} style={{ width: '100%', height: '100%' }} />;
}
