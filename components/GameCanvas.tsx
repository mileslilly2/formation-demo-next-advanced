'use client';
import React, { useEffect, useRef } from 'react';

import { useInput } from '../lib/inputManager';
import { updateBullets, renderBullets } from '../lib/bulletManager';
import { handleCollisions } from '../lib/collision';
import {
  renderBackground,
  renderPlayerFormation,
  renderEnemies,
  renderHUD,
} from '../lib/render';
import { spawnEnemies, updateEnemies } from '../lib/enemyManager';
import { updateFormation } from '../lib/formationManager';
import { fireFromShip } from '../lib/weaponManager';

import { Bullet, Enemy, PlayerShip } from '../lib/types';
import { loadSprite } from '../lib/spriteLoader';
import { loadInsectFormations, buildFormation } from '../lib/formationLoader';
import { loadEnemyFormation } from '../lib/enemyLoader';

type Props = { selectedFile: string };

export default function GameCanvas({ selectedFile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // player state as ref to avoid React re-renders every frame
  const playerRef = useRef({ x: 0, y: 0, speed: 300 });

  // input hook at top (valid React hook usage). It reads player x via the ref.
  const getInput = useInput(canvasRef, () => playerRef.current.x);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;

    function resize() {
      c.width = c.clientWidth * devicePixelRatio;
      c.height = c.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // --- LOAD SPRITES ---
    let spriteImg: HTMLImageElement | null = null;
    let spriteMeta: any = null;
    loadSprite().then(({ img, meta }) => {
      spriteImg = img;
      spriteMeta = meta;
    });

    // --- LOAD PLAYER FORMATIONS ---
    let insectSpec: any = null;
    let formationIndex = 0;
    let playerFormation: PlayerShip[] = [];
    loadInsectFormations().then((spec) => {
      insectSpec = spec;
      if (spec.formations.length > 0) {
        playerFormation = buildFormation(
          spec.formations[0],
          c.clientWidth,
          c.clientHeight
        );
      } else {
        // fallback single ship
        playerFormation = [{ x: c.clientWidth / 2, y: c.clientHeight - 100 }];
      }
    });

    // --- LOAD ENEMIES ---
    let enemySpec: any = null;
    if (selectedFile) loadEnemyFormation(selectedFile).then((spec) => (enemySpec = spec));

    // --- GAME STATE ---
    playerRef.current.x = c.clientWidth / 2;
    playerRef.current.y = c.clientHeight - 100;

    const bullets: Bullet[] = [];
    const enemies: Enemy[] = [];
    let spawnIndex = 0;
    const startTime = performance.now();

    // --- FORMATION SWAP ---
    const swapKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && insectSpec) {
        formationIndex = (formationIndex + 1) % insectSpec.formations.length;
        playerFormation = buildFormation(
          insectSpec.formations[formationIndex],
          c.clientWidth,
          c.clientHeight
        );
      }
    };
    window.addEventListener('keydown', swapKey);

    // --- LOOP (FPS-capped) ---
    const trailHistory: { x: number; y: number }[] = [];
    const MAX_HISTORY = 200;
    const FPS = 30;
    let lastRAF = 0;
    let last = performance.now();

    function loop(now: number) {
      // FPS cap
      if (now - lastRAF < 1000 / FPS) {
        requestAnimationFrame(loop);
        return;
      }
      lastRAF = now;

      const dt = (now - last) / 1000;
      last = now;
      const cw = c.clientWidth, ch = c.clientHeight;

      // INPUT
      const { move, fire } = getInput();
      const p = playerRef.current;
      p.x = Math.max(20, Math.min(cw - 20, p.x + move * p.speed * dt));

      // trail history
      trailHistory.unshift({ x: p.x, y: p.y });
      if (trailHistory.length > MAX_HISTORY) trailHistory.pop();

      // FORMATION
      updateFormation(playerFormation, p, trailHistory, now);

      // FIRING
      if (fire) {
        for (const ship of playerFormation) {
          fireFromShip(ship, bullets, dt, ship.weapon ?? 'basic');
        }
      }

      // ENEMIES
      spawnIndex = spawnEnemies(enemies, enemySpec, spawnIndex, startTime, cw, ch);
      updateEnemies(enemies, bullets, dt, playerFormation);

      // BULLETS
      updateBullets(bullets, dt, ch);

      // COLLISIONS
      handleCollisions(bullets, enemies, playerFormation);

      // RENDER
      renderBackground(ctx, cw, ch);
      if (spriteImg && spriteMeta) {
        renderPlayerFormation(ctx, playerFormation, p, spriteImg, spriteMeta, now);
        renderEnemies(ctx, enemies, spriteImg, spriteMeta, now);
      } else {
        // fallback circles until sprites load
        renderPlayerFormation(ctx, playerFormation, p, null as any, null as any, now);
        renderEnemies(ctx, enemies, null as any, null as any, now);
      }
      renderBullets(ctx, bullets);
      renderHUD(ctx);

      // DEBUG TEXT
      ctx.fillStyle = 'lime';
      ctx.font = '12px monospace';
      ctx.fillText(
        `img:${!!spriteImg} frames:${spriteMeta?.frames ?? 0} cols:${spriteMeta?.cols ?? 0} rows:${spriteMeta?.rows ?? 0} formation:${playerFormation.length}`,
        10, 40
      );

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', swapKey);
    };
  }, [selectedFile]); // intentionally NOT depending on getInput (stable via ref)

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
      }}
    />
  );
}
