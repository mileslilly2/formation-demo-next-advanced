import { Bullet } from './types';

export function updateBullets(bullets: Bullet[], dt: number, ch: number) {
  for (const b of bullets) {
    b.x += (b.vx ?? 0) * dt;
    b.y += b.vy * dt;
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -20 || bullets[i].y > ch + 20) bullets.splice(i, 1);
  }
}

export function renderBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  for (const b of bullets) {
    switch (b.type) {
      case 'small': ctx.fillStyle = '#ff0'; ctx.fillRect(b.x - 2, b.y - 6, 4, 8); break;
      case 'spread': ctx.fillStyle = '#0f0'; ctx.fillRect(b.x - 2, b.y - 6, 4, 8); break;
      case 'laser': ctx.fillStyle = '#0ff'; ctx.fillRect(b.x - 1, b.y - 16, 2, 20); break;
      case 'wide': ctx.fillStyle = '#f0f'; ctx.fillRect(b.x - 6, b.y - 8, 12, 12); break;
      case 'enemy_basic': ctx.fillStyle = 'red'; ctx.fillRect(b.x - 2, b.y - 6, 4, 8); break;
      case 'enemy_spread': ctx.fillStyle = 'orange'; ctx.fillRect(b.x - 3, b.y - 6, 6, 8); break;
      case 'enemy_sniper': ctx.fillStyle = 'purple'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill(); break;
      default: ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    }
  }
}
