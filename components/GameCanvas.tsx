'use client';
import React, { useEffect, useRef } from 'react';

function useKeyControls() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
}

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
      if (!c) return;
      c.width = c.clientWidth * devicePixelRatio;
      c.height = c.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Sprite loader
    let spriteImg: HTMLImageElement | null = null;
    let spriteMeta: any = null;
    fetch('/sprites/insect_shapes_sheet.json')
      .then(r => (r.ok ? r.json() : null))
      .then(meta => {
        if (meta) {
          spriteMeta = meta;
          const img = new Image();
          img.src = meta.image || '/sprites/insect_shapes_sheet.png';
          img.onload = () => { spriteImg = img; };
        }
      });

    // Player + formation
    const player = { x: c.clientWidth / 2, y: c.clientHeight - 100, speed: 300, cooldown: 0 };
    let playerFormation: any[] = [{ id: 'solo', x: player.x, y: player.y, hp: 3, behavior: 'static' }];

    // Load insects.json
    let insectSpec: any = null;
    let formationIndex = 0;
    fetch('/formations/insects.json')
      .then(r => (r.ok ? r.json() : null))
      .then(json => { insectSpec = json; formationIndex = 0; });

    function buildFormation(def: any, baseX: number, baseY: number, cw: number, ch: number) {
      return (def.ships || []).map((s: any, i: number) => ({
        id: `${def.id}_${i}_${Math.random()}`,
        x: baseX + ((s.x_norm ?? 50) - 50) / 100 * cw * 0.4,
        y: baseY + ((s.y_norm ?? 50) - 50) / 100 * ch * 0.4,
        hp: s.hp ?? 2,
        behavior: def.behavior || 'static',
        baseOffsetX: ((s.x_norm ?? 50) - 50) / 100 * cw * 0.4,
        baseOffsetY: ((s.y_norm ?? 50) - 50) / 100 * ch * 0.4
      }));
    }

    // Enemy formation spec
    let formationSpec: any = null;
    let spawnIndex = 0;
    let startTime = performance.now();
    if (selectedFile) {
      fetch('/formations/' + selectedFile)
        .then(r => (r.ok ? r.json() : null))
        .then(json => {
          formationSpec = json;
          spawnIndex = 0;
          startTime = performance.now();
        });
    }

    const bullets: { x: number; y: number; vy: number }[] = [];
    const enemies: { x: number; y: number; vx: number; vy: number; hp: number }[] = [];

    // Handle F key to cycle formations
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'f' && insectSpec && insectSpec.formations.length > 0) {
        formationIndex = (formationIndex + 1) % insectSpec.formations.length;
        const def = insectSpec.formations[formationIndex];
        playerFormation = buildFormation(def, player.x, player.y, c.clientWidth, c.clientHeight);
      }
    });

    let last = performance.now();
    function loop(now: number) {
      const dt = (now - last) / 1000;
      last = now;

      const cw = c.clientWidth, ch = c.clientHeight;

      // Input
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

      // Update formation positions relative to player
      if (playerFormation.length > 0) {
        for (const ship of playerFormation) {
          if (ship.behavior === 'static' || ship.behavior === 'line') {
            ship.x = player.x + ship.baseOffsetX;
            ship.y = player.y + ship.baseOffsetY;
          } else if (ship.behavior === 'orbit') {
            const t = now / 1000;
            ship.x = player.x + ship.baseOffsetX + Math.cos(t + ship.baseOffsetX) * 20;
            ship.y = player.y + ship.baseOffsetY + Math.sin(t + ship.baseOffsetY) * 20;
          }
        }
      }

      // Spawn enemies from formation JSON
      if (formationSpec && formationSpec.spawn) {
        const tElapsed = now - startTime;
        while (
          spawnIndex < formationSpec.spawn.length &&
          formationSpec.spawn[spawnIndex].t_ms <= tElapsed
        ) {
          const s = formationSpec.spawn[spawnIndex];
          enemies.push({
            x: (s.x_norm ?? 50) / 100 * cw,
            y: (s.y_norm ?? 0) / 100 * ch,
            vx: s.vx_px_s ?? 0,
            vy: s.vy_px_s ?? 50,
            hp: s.hp ?? 1,
          });
          spawnIndex++;
        }
      }

      // Update bullets
      for (const b of bullets) b.y += b.vy * dt;
      for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].y < -10) bullets.splice(i, 1);
      }

      // Update enemies
      for (const e of enemies) {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }

      // Collisions
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          const b = bullets[bi];
          const dx = e.x - b.x, dy = e.y - b.y;
          if (dx * dx + dy * dy < 20 * 20) {
            e.hp -= 1;
            bullets.splice(bi, 1);
            if (e.hp <= 0) {
              enemies.splice(ei, 1);
              break;
            }
          }
        }
      }

      // Render
      ctx.fillStyle = '#061025';
      ctx.fillRect(0, 0, cw, ch);

      // Draw player formation ships
      for (const ship of playerFormation) {
        if (spriteImg && spriteMeta) {
          const { frame_width, frame_height } = spriteMeta;
          ctx.drawImage(
            spriteImg,
            0, 0, frame_width, frame_height,
            ship.x - frame_width / 2,
            ship.y - frame_height / 2,
            frame_width, frame_height
          );
        } else {
          ctx.fillStyle = '#6cf';
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw bullets
      ctx.fillStyle = '#fff';
      for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);

      // Draw enemies
      for (const e of enemies) {
        ctx.fillStyle = '#f66';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // HUD
      ctx.fillStyle = 'white';
      ctx.font = '14px sans-serif';
      ctx.fillText('Arrow keys/A-D move • Space/W shoot • F swap formation', 12, 20);

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [keys, selectedFile]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
