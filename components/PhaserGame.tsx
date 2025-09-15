'use client';
import React, { useEffect, useRef } from 'react';
import type * as PhaserType from 'phaser';

type Props = { selectedFile?: string };

export default function PhaserGame({ selectedFile }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const Phaser = await import('phaser');
      const { BootScene } = await import('../phaser/scenes/BootScene');
      const { MenuScene } = await import('../phaser/scenes/MenuScene');
      const { PlayScene } = await import('../phaser/scenes/PlayScene');

      if (!mounted || !rootRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: rootRef.current.clientWidth || 800,
        height: rootRef.current.clientHeight || 600,
        parent: rootRef.current,
        backgroundColor: '#061025',
        physics: {
          default: 'arcade',
          arcade: { gravity: { y: 0, x: 0 }, debug: false }
        },
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [BootScene, MenuScene, PlayScene],
      };

      gameRef.current = new Phaser.Game(config);

      setTimeout(() => {
        if (rootRef.current) {
          try { rootRef.current.focus(); } catch {}
        }
      }, 50);
    })();

    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedFile && gameRef.current) {
      (gameRef.current as any).events.emit('formation:selected', selectedFile);
    }
  }, [selectedFile]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      style={{ width: '100%', height: '100%', outline: 'none' }}
      onClick={() => { if (rootRef.current) rootRef.current.focus(); }}
    />
  );
}
