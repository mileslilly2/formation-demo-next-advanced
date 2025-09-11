import { Bullet, Enemy, PlayerShip } from './types';

export function renderBackground(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  ctx.fillStyle = '#061025';
  ctx.fillRect(0, 0, cw, ch);
}

export function renderPlayerFormation(
  ctx: CanvasRenderingContext2D,
  formation: PlayerShip[],
  fallbackPlayer: { x: number; y: number },
  spriteImg: HTMLImageElement | null,
  spriteMeta: any
) {
  if (formation.length > 0) {
    for (const ship of formation) {
      if (spriteImg && spriteMeta) {
        const { frame_width, frame_height } = spriteMeta;
        ctx.drawImage(
          spriteImg,
          0, 0, frame_width, frame_height, // source
          ship.x - frame_width / 2, ship.y - frame_height / 2,
          frame_width, frame_height
        );
      } else {
        ctx.fillStyle = '#6cf';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // fallback single ship
    ctx.fillStyle = '#6cf';
    ctx.beginPath();
    ctx.arc(fallbackPlayer.x, fallbackPlayer.y, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
  for (const e of enemies) {
    ctx.fillStyle = '#f66';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderHUD(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'white';
  ctx.font = '14px sans-serif';
  ctx.fillText('←/A, →/D or Touch • Space/🔥 Fire • F swap formation', 12, 20);
}
