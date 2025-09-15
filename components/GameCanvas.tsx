'use client';
import React, { useEffect, useRef } from 'react';


import { useInput } from '../lib/inputManager';
import { updateBullets } from '../lib/bulletManager';
import { renderBullets, renderBackground, renderPlayerFormation, renderEnemies, renderHUD } from '../lib/render';
import { handleCollisions } from '../lib/collision';
import { spawnEnemies, updateEnemies } from '../lib/enemyManager';
import { updateFormation } from '../lib/formationManager';
import { fireFromShip } from '../lib/weaponManager';

import { Bullet, Enemy, PlayerShip } from '../lib/types';
import { loadSprite } from '../lib/spriteLoader';
import { loadInsectFormations, buildFormation } from '../lib/formationLoader';
import { loadEnemyFormation } from '../lib/enemyLoader';
import { setBackground } from '../lib/render';

// inside useEffect, after you have ctx and c

type Props = { selectedFile: string };

export default function GameCanvas({ selectedFile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player state (kept in a ref so we don't re-render React every frame)
  const playerRef = useRef({ x: 0, y: 0, speed: 300 });

  // Input hook reads player x via this getter
  const getInput = useInput(canvasRef, () => playerRef.current.x);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;

    const bgImg = new Image();
    bgImg.src = '/sprites/pillars_of_creation.png';
    bgImg.onload = () => setBackground(bgImg);

    // --------- LOAD ASSETS ---------
    let spriteImg: HTMLImageElement | null = null;
    let spriteMeta: any = null;
    loadSprite().then(({ img, meta }) => {
      spriteImg = img;
      spriteMeta = meta;
    });

    let insectSpec: any = null;
    let formationIndex = 0;
    let playerFormation: PlayerShip[] = [];

    // Will be called after insectSpec loads and on resize
    const rebuildFormation = () => {
      if (!insectSpec) return;
      playerFormation = buildFormation(
        insectSpec.formations[formationIndex],
        c.clientWidth,
        c.clientHeight
      );
    };

    loadInsectFormations().then((spec) => {
      insectSpec = spec;
      if (spec.formations.length > 0) {
        rebuildFormation();
      } else {
        // fallback single ship
        playerFormation = [{ x: c.clientWidth / 2, y: c.clientHeight - 100 }];
      }
    });

    let enemySpec: any = null;
    if (selectedFile) loadEnemyFormation(selectedFile).then((spec) => (enemySpec = spec));

    // --------- CANVAS RESIZE TO SCREEN ---------
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = c;

      c.width = Math.max(1, Math.floor(clientWidth * dpr));
      c.height = Math.max(1, Math.floor(clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      playerRef.current.x = clientWidth / 2;
      playerRef.current.y = clientHeight - 100;

      rebuildFormation();
    }

    resize();
    window.addEventListener('resize', resize);

    // --------- GAME STATE ---------
    const bullets: Bullet[] = [];
    const enemies: Enemy[] = [];
    let spawnIndex = 0;
    const startTime = performance.now();

    // Camera scroll position
    let cameraY = 0;
    const scrollSpeed = 50; // pixels per second

    // Swap formation with 'F'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && insectSpec) {
        formationIndex = (formationIndex + 1) % insectSpec.formations.length;
        rebuildFormation();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // --------- MAIN LOOP (FPS-capped) ---------
    const FPS = 30;
    let lastRAF = 0;
    let last = performance.now();

    function loop(now: number) {
      if (now - lastRAF < 1000 / FPS) {
        requestAnimationFrame(loop);
        return;
      }
      lastRAF = now;

      const dt = (now - last) / 1000;
      last = now;

      const cw = c.clientWidth;
      const ch = c.clientHeight;

      // SCROLL CAMERA
      cameraY += scrollSpeed * dt;

      // INPUT
      const { move, fire } = getInput();
      const p = playerRef.current;
      p.x = Math.max(20, Math.min(cw - 20, p.x + move * p.speed * dt));

      // FORMATION
      updateFormation(playerFormation, p, [], now);

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
      renderBackground(ctx, cw, ch, cameraY);
      if (spriteImg && spriteMeta) {
        renderPlayerFormation(ctx, playerFormation, p, spriteImg, spriteMeta, now, cameraY);
        renderEnemies(ctx, enemies, spriteImg, spriteMeta, now, cameraY);
      } else {
        renderPlayerFormation(ctx, playerFormation, p, null as any, null as any, now, cameraY);
        renderEnemies(ctx, enemies, null as any, null as any, now, cameraY);
      }
      renderBullets(ctx, bullets, cameraY);
      renderHUD(ctx);

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedFile]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100dvh',
        display: 'block',
        touchAction: 'none',
      }}
    />
  );
}
