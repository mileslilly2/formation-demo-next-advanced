'use client';
import React, { useEffect, useRef } from 'react';
import useKeyControls from '../hooks/useKeyControls';
import { loadSprite } from '../lib/spriteLoader';
import { loadInsectFormations, buildFormation } from '../lib/formationLoader';
import { loadEnemyFormation } from '../lib/enemyLoader';

type Props = { selectedFile: string };

export default function GameCanvas({ selectedFile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keys = useKeyControls();

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    function resize() {
      c.width = c.clientWidth * devicePixelRatio;
      c.height = c.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // --- LOADERS ---
    let spriteImg: HTMLImageElement | null = null;
    let spriteMeta: any = null;
    loadSprite().then(({ img, meta }) => { spriteImg = img; spriteMeta = meta; });

    let insectSpec: any = null;
    let formationIndex = 0;
    let playerFormation: any[] = [];
    loadInsectFormations().then(spec => {
      insectSpec = spec;
      if (spec.formations.length > 0) {
        playerFormation = buildFormation(spec.formations[0], c.clientWidth, c.clientHeight);
      }
    });

    let enemySpec: any = null;
    if (selectedFile) loadEnemyFormation(selectedFile).then(spec => enemySpec = spec);

    // --- GAME STATE ---
    const player = { x: c.clientWidth / 2, y: c.clientHeight - 100, speed: 300, cooldown: 0 };
    const bullets: { x: number; y: number; vy: number }[] = [];
    const enemies: { x: number; y: number; vx: number; vy: number; hp: number }[] = [];
    let spawnIndex = 0;
    let startTime = performance.now();

    // --- TRAIL HISTORY ---
    const trailHistory: { x: number; y: number }[] = [];
    const MAX_HISTORY = 200;

    // --- FORMATION SWAP KEY ---
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'f' && insectSpec) {
        formationIndex = (formationIndex + 1) % insectSpec.formations.length;
        playerFormation = buildFormation(insectSpec.formations[formationIndex], c.clientWidth, c.clientHeight);
      }
    });

    let last = performance.now();
    function loop(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const cw = c.clientWidth, ch = c.clientHeight;

      // --- INPUT ---
      const left = keys.current['arrowleft'] || keys.current['a'];
      const right = keys.current['arrowright'] || keys.current['d'];
      const fire = keys.current[' '] || keys.current['space'] || keys.current['arrowup'] || keys.current['w'];
      const move = (right ? 1 : 0) - (left ? 1 : 0);
      player.x = Math.max(20, Math.min(cw - 20, player.x + move * player.speed * dt));
      player.cooldown = Math.max(0, player.cooldown - dt);
      if (fire && player.cooldown === 0) {
        bullets.push({ x: player.x, y: player.y - 20, vy: -400 });
        player.cooldown = 0.2;
      }

      // record leader position
      trailHistory.unshift({ x: player.x, y: player.y });
      if (trailHistory.length > MAX_HISTORY) trailHistory.pop();

      // --- UPDATE FORMATION ---
      if (playerFormation.length > 0) {
        for (let i = 0; i < playerFormation.length; i++) {
          const ship = playerFormation[i];
          if (ship.behavior === 'trail') {
            const delay = (i + 1) * 10;
            if (trailHistory[delay]) {
              ship.x = trailHistory[delay].x;
              ship.y = trailHistory[delay].y;
            } else {
              ship.x = player.x; ship.y = player.y;
            }
          } else if (ship.behavior === 'static' || ship.behavior === 'line') {
            ship.x = player.x + ship.baseOffsetX;
            ship.y = player.y + ship.baseOffsetY;
          } else if (ship.behavior === 'orbit') {
            const t = now / 1000;
            ship.x = player.x + ship.baseOffsetX + Math.cos(t + ship.baseOffsetX) * 20;
            ship.y = player.y + ship.baseOffsetY + Math.sin(t + ship.baseOffsetY) * 20;
          }
        }
      }

      // --- ENEMY SPAWN ---
      if (enemySpec && enemySpec.spawn) {
        const tElapsed = now - startTime;
        while (spawnIndex < enemySpec.spawn.length && enemySpec.spawn[spawnIndex].t_ms <= tElapsed) {
          const s = enemySpec.spawn[spawnIndex];
          enemies.push({
            x: (s.x_norm ?? 50) / 100 * cw,
            y: (s.y_norm ?? 0) / 100 * ch,
            vx: s.vx_px_s ?? 0,
            vy: s.vy_px_s ?? 50,
            hp: s.hp ?? 1
          });
          spawnIndex++;
        }
      }

      // --- UPDATE BULLETS & ENEMIES ---
      for (const b of bullets) b.y += b.vy * dt;
      for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].y < -10) bullets.splice(i, 1);
      for (const e of enemies) { e.x += e.vx * dt; e.y += e.vy * dt; }

      // --- COLLISIONS ---
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          const b = bullets[bi];
          const dx = e.x - b.x, dy = e.y - b.y;
          if (dx * dx + dy * dy < 20 * 20) {
            e.hp -= 1; bullets.splice(bi, 1);
            if (e.hp <= 0) { enemies.splice(ei, 1); break; }
          }
        }
      }

      // --- RENDER ---
      ctx.fillStyle = '#061025';
      ctx.fillRect(0, 0, cw, ch);

      // player formation ships
      for (const ship of playerFormation) {
        if (spriteImg && spriteMeta) {
          const { frame_width, frame_height } = spriteMeta;
          ctx.drawImage(spriteImg, 0, 0, frame_width, frame_height,
            ship.x - frame_width / 2, ship.y - frame_height / 2, frame_width, frame_height);
        } else {
          ctx.fillStyle = '#6cf'; ctx.beginPath(); ctx.arc(ship.x, ship.y, 10, 0, Math.PI * 2); ctx.fill();
        }
      }

      // bullets
      ctx.fillStyle = '#fff';
      for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);

      // enemies
      for (const e of enemies) { ctx.fillStyle = '#f66'; ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI * 2); ctx.fill(); }

      ctx.fillStyle = 'white'; ctx.font = '14px sans-serif';
      ctx.fillText('←/A, →/D move • Space shoot • F swap formation', 12, 20);

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
    return () => window.removeEventListener('resize', resize);
  }, [keys, selectedFile]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
