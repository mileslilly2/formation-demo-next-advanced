import { Bullet, Enemy, PlayerShip } from './types';

let bg: HTMLImageElement | null = null;
export function setBackground(img: HTMLImageElement) {
  bg = img;
}

// --- Background ---
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  cameraY: number = 0
) {
  if (bg) {
    ctx.drawImage(
      bg,
      0, cameraY,          // slice of background
      bg.width, ch,        // source width/height
      0, 0,                // draw at top-left
      cw, ch               // stretch to canvas
    );
  } else {
    ctx.fillStyle = '#061025';
    ctx.fillRect(0, 0, cw, ch);
  }
}

// --- Ship Sprite Drawing ---
export function drawShipSprite(
  ctx: CanvasRenderingContext2D,
  spriteImg: HTMLImageElement,
  spriteMeta: {
    frame_width: number;
    frame_height: number;
    frames: number;
    cols: number;
    rows: number;
    frame_duration_ms?: number;
  },
  x: number,
  y: number,
  now: number
) {
  const {
    frame_width,
    frame_height,
    frames,
    cols,
    frame_duration_ms = 120,
  } = spriteMeta;

  const frameIndex = Math.floor(now / frame_duration_ms) % frames;
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);

  ctx.drawImage(
    spriteImg,
    col * frame_width,
    row * frame_height,
    frame_width,
    frame_height,
    x - frame_width / 2,
    y - frame_height / 2,
    frame_width,
    frame_height
  );
}

// --- Player Formation ---
export function renderPlayerFormation(
  ctx: CanvasRenderingContext2D,
  formation: PlayerShip[],
  fallbackPlayer: { x: number; y: number },
  spriteImg: HTMLImageElement | null,
  spriteMeta: any,
  now: number,
  cameraY: number = 0
) {
  if (formation.length > 0) {
    for (const ship of formation) {
      const drawY = ship.y - cameraY;
      if (spriteImg && spriteMeta?.frame_width && spriteMeta?.frame_height) {
        drawShipSprite(ctx, spriteImg, spriteMeta, ship.x, drawY, now);
      } else {
        ctx.fillStyle = '#6cf';
        ctx.beginPath();
        ctx.arc(ship.x, drawY, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    ctx.fillStyle = '#6cf';
    ctx.beginPath();
    ctx.arc(fallbackPlayer.x, fallbackPlayer.y - cameraY, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Enemies ---
export function renderEnemies(
  ctx: CanvasRenderingContext2D,
  enemies: Enemy[],
  spriteImg?: HTMLImageElement | null,
  spriteMeta?: any,
  now: number = 0,
  cameraY: number = 0
) {
  for (const e of enemies) {
    const drawY = e.y - cameraY;
    if (spriteImg && spriteMeta?.frame_width && spriteMeta?.frame_height) {
      drawShipSprite(ctx, spriteImg, spriteMeta, e.x, drawY, now);
    } else {
      ctx.fillStyle = '#f66';
      ctx.beginPath();
      ctx.arc(e.x, drawY, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Bullets ---
export function renderBullets(
  ctx: CanvasRenderingContext2D,
  bullets: Bullet[],
  cameraY: number = 0
) {
  for (const b of bullets) {
    const drawY = b.y - cameraY;
    switch (b.type) {
      case 'small': ctx.fillStyle = '#ff0'; ctx.fillRect(b.x - 2, drawY - 6, 4, 8); break;
      case 'spread': ctx.fillStyle = '#0f0'; ctx.fillRect(b.x - 2, drawY - 6, 4, 8); break;
      case 'laser': ctx.fillStyle = '#0ff'; ctx.fillRect(b.x - 1, drawY - 16, 2, 20); break;
      case 'wide': ctx.fillStyle = '#f0f'; ctx.fillRect(b.x - 6, drawY - 8, 12, 12); break;
      case 'enemy_basic': ctx.fillStyle = 'red'; ctx.fillRect(b.x - 2, drawY - 6, 4, 8); break;
      case 'enemy_spread': ctx.fillStyle = 'orange'; ctx.fillRect(b.x - 3, drawY - 6, 6, 8); break;
      case 'enemy_sniper': ctx.fillStyle = 'purple'; ctx.beginPath(); ctx.arc(b.x, drawY, 4, 0, Math.PI*2); ctx.fill(); break;
      default: ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 2, drawY - 8, 4, 12);
    }
  }
}

// --- HUD ---
export function renderHUD(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'white';
  ctx.font = '14px sans-serif';
  ctx.fillText('←/A, →/D or Touch • Space/🔥 Fire • F swap formation', 12, 20);
}
