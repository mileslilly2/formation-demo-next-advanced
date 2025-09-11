'use client';
import React, { useEffect, useRef, useState } from 'react';

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

  // ✅ player state tracked with React state so `useInput` can see it
  const [player, setPlayer] = useState({
    x: 0,
    y: 0,
    speed: 300,
  });

  // ✅ input hook at top level
  const getInput = useInput(canvasRef, () => player.x);

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
      }
    });

    // --- LOAD ENEMIES ---
    let enemySpec: any = null;
    if (selectedFile)
      loadEnemyFormation(selectedFile).then((spec) => (enemySpec = spec));

    // --- GAME STATE ---
    setPlayer({
      x: c.clientWidth / 2,
      y: c.clientHeight - 100,
      speed: 300,
    });
    const bullets: Bullet[] = [];
    const enemies: Enemy[] = [];
    let spawnIndex = 0;
    let startTime = performance.now();

    // --- FORMATION SWAP ---
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'f' && insectSpec) {
        formationIndex = (formationIndex + 1) % insectSpec.formations.length;
        playerFormation = buildFormation(
          insectSpec.formations[formationIndex],
          c.clientWidth,
          c.clientHeight
        );
      }
    });

    // --- LOOP ---
    const trailHistory: { x: number; y: number }[] = [];
    const MAX_HISTORY = 200;
    let last = performance.now();

    function loop(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const cw = c.clientWidth,
        ch = c.clientHeight;

      // INPUT
      const { move, fire } = getInput();
      const newX = Math.max(
        20,
        Math.min(cw - 20, player.x + move * player.speed * dt)
      );
      setPlayer((p) => ({ ...p, x: newX }));

      // trail history
      trailHistory.unshift({ x: newX, y: player.y });
      if (trailHistory.length > MAX_HISTORY) trailHistory.pop();

      // FORMATION
      updateFormation(playerFormation, { ...player, x: newX }, trailHistory, now);

      // FIRING
      if (fire) {
        for (const ship of playerFormation) {
          fireFromShip(ship, bullets, dt, ship.weapon ?? 'basic');
        }
      }

      // ENEMIES
      spawnIndex = spawnEnemies(
        enemies,
        enemySpec,
        spawnIndex,
        startTime,
        cw,
        ch
      );
      updateEnemies(enemies, bullets, dt, playerFormation);

      // BULLETS
      updateBullets(bullets, dt, ch);

      // COLLISIONS
      handleCollisions(bullets, enemies, playerFormation);

      // RENDER
      renderBackground(ctx, cw, ch);
      renderPlayerFormation(ctx, playerFormation, player, spriteImg, spriteMeta);
      renderEnemies(ctx, enemies);
      renderBullets(ctx, bullets);
      renderHUD(ctx);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [selectedFile, getInput, player]);

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
