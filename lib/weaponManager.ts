import { Bullet, PlayerShip } from './types';

export type WeaponType = 'basic' | 'spread' | 'laser' | 'wide';

export function fireFromShip(
  ship: PlayerShip,
  bullets: Bullet[],
  dt: number,
  weapon: WeaponType = 'basic'
) {
  if (!ship.cooldown) ship.cooldown = 0;
  ship.cooldown = Math.max(0, ship.cooldown - dt);
  if (ship.cooldown > 0) return;

  switch (weapon) {
    case 'spread':
      bullets.push({ x: ship.x, y: ship.y - 20, vy: -300, vx: -80, type: 'spread', owner: 'player' });
      bullets.push({ x: ship.x, y: ship.y - 20, vy: -300, type: 'spread', owner: 'player' });
      bullets.push({ x: ship.x, y: ship.y - 20, vy: -300, vx: 80, type: 'spread', owner: 'player' });
      ship.cooldown = 0.5;
      break;

    case 'laser':
      bullets.push({ x: ship.x, y: ship.y - 30, vy: -600, type: 'laser', owner: 'player' });
      ship.cooldown = 0.8;
      break;

    case 'wide':
      bullets.push({ x: ship.x - 10, y: ship.y - 20, vy: -350, type: 'wide', owner: 'player' });
      bullets.push({ x: ship.x + 10, y: ship.y - 20, vy: -350, type: 'wide', owner: 'player' });
      ship.cooldown = 0.6;
      break;

    default: // basic
      bullets.push({ x: ship.x, y: ship.y - 20, vy: -400, type: 'small', owner: 'player' });
      ship.cooldown = 0.4;
      break;
  }
}
