import { Bullet, Enemy, PlayerShip } from './types';

// --- Background ---
export function renderBackground(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  ctx.fillStyle = '#061025';
  ctx.fillRect(0, 0, cw, ch);
}

// --- Ship Sprite Drawing (uses cols, rows, frames, frame_duration_ms) ---
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

  // 1️⃣ Pick frame based on elapsed time
  const frameIndex = Math.floor(now / frame_duration_ms) % frames;

  // 2️⃣ Convert frame index to sprite sheet coordinates
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);

  // 3️⃣ Draw correct slice of sprite sheet at (x,y)
  ctx.drawImage(
    spriteImg,
    col * frame_width,     // sx
    row * frame_height,    // sy
    frame_width,           // sw
    frame_height,          // sh
    x - frame_width / 2,   // dx
    y - frame_height / 2,  // dy
    frame_width,           // dw
    frame_height           // dh
  );
}

// --- Player Formation ---
export function renderPlayerFormation(
  ctx: CanvasRenderingContext2D,
  formation: PlayerShip[],
  fallbackPlayer: { x: number; y: number },
  spriteImg: HTMLImageElement | null,
  spriteMeta: any,
  now: number
) {
  if (formation.length > 0) {
    for (const ship of formation) {
      if (spriteImg && spriteMeta) {
        drawShipSprite(ctx, spriteImg, spriteMeta, ship.x, ship.y, now);
      } else {
        // fallback circle
        ctx.fillStyle = '#6cf';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // fallback single player if no formation
    ctx.fillStyle = '#6cf';
    ctx.beginPath();
    ctx.arc(fallbackPlayer.x, fallbackPlayer.y, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Enemies ---
export function renderEnemies(
  ctx: CanvasRenderingContext2D,
  enemies: Enemy[],
  spriteImg?: HTMLImageElement | null,
  spriteMeta?: any,
  now: number = 0
) {
  for (const e of enemies) {
    if (spriteImg && spriteMeta) {
      drawShipSprite(ctx, spriteImg, spriteMeta, e.x, e.y, now);
    } else {
      // fallback circle
      ctx.fillStyle = '#f66';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Bullets ---
export function renderBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  for (const b of bullets) {
    ctx.fillStyle = b.owner === 'player' ? '#6f6' : '#f33';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- HUD ---
export function renderHUD(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'white';
  ctx.font = '14px sans-serif';
  ctx.fillText('←/A, →/D or Touch • Space/🔥 Fire • F swap formation', 12, 20);
}
