import { Bullet } from './types';

export function handleCollisions(bullets: Bullet[], enemies: any[], playerShips: any[]) {
  // player bullets vs enemies
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (b.owner !== 'player') continue;
      const dx = e.x - b.x, dy = e.y - b.y;
      if (dx * dx + dy * dy < 20 * 20) {
        e.hp -= (b.hp ?? 1);
        bullets.splice(bi, 1);
        if (e.hp <= 0) { enemies.splice(ei, 1); break; }
      }
    }
  }

  // enemy bullets vs player
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (b.owner !== 'enemy') continue;
    for (const ship of playerShips) {
      const dx = ship.x - b.x, dy = ship.y - b.y;
      if (dx * dx + dy * dy < 16 * 16) {
        bullets.splice(bi, 1);
        break;
      }
    }
  }
}
