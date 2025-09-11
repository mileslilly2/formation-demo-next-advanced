import { Enemy, Bullet, PlayerShip } from './types';

export function spawnEnemies(
  enemies: Enemy[],
  enemySpec: any,
  spawnIndex: number,
  startTime: number,
  cw: number,
  ch: number
): number {
  if (!enemySpec || !enemySpec.spawn) return spawnIndex;
  const tElapsed = performance.now() - startTime;
  while (
    spawnIndex < enemySpec.spawn.length &&
    enemySpec.spawn[spawnIndex].t_ms <= tElapsed
  ) {
    const s = enemySpec.spawn[spawnIndex];
    enemies.push({
      x: ((s.x_norm ?? 50) / 100) * cw,
      y: ((s.y_norm ?? 0) / 100) * ch,
      vx: s.vx_px_s ?? 0,
      vy: s.vy_px_s ?? 50,
      hp: s.hp ?? 1,
    });
    spawnIndex++;
  }
  return spawnIndex;
}

export function updateEnemies(
  enemies: Enemy[],
  bullets: Bullet[],
  dt: number,
  playerFormation: PlayerShip[]
) {
  for (const e of enemies) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    if (!e.cooldown) e.cooldown = 0;
    e.cooldown = Math.max(0, e.cooldown - dt);

    if (e.cooldown === 0) {
      if (e.hp > 2) {
        bullets.push({ x: e.x, y: e.y + 10, vy: 200, type: 'enemy_spread', owner: 'enemy' });
        bullets.push({ x: e.x, y: e.y + 10, vy: 200, vx: -80, type: 'enemy_spread', owner: 'enemy' });
        bullets.push({ x: e.x, y: e.y + 10, vy: 200, vx: 80, type: 'enemy_spread', owner: 'enemy' });
        e.cooldown = 1.2;
      } else if (Math.random() < 0.3 && playerFormation.length > 0) {
        let target = playerFormation[0];
        let bestDist = Infinity;
        for (const s of playerFormation) {
          const d = Math.abs(s.x - e.x) + Math.abs(s.y - e.y);
          if (d < bestDist) { bestDist = d; target = s; }
        }
        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        bullets.push({ x: e.x, y: e.y + 10, vx: dx / mag * 200, vy: dy / mag * 200, type: 'enemy_sniper', owner: 'enemy' });
        e.cooldown = 2.0;
      } else {
        bullets.push({ x: e.x, y: e.y + 10, vy: 250, type: 'enemy_basic', owner: 'enemy' });
        e.cooldown = 1.0;
      }
    }
  }
}
