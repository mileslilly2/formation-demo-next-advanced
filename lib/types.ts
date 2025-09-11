// --- BULLETS ---
export type BulletOwner = 'player' | 'enemy';

export type Bullet = {
  x: number;
  y: number;
  vx?: number;         // velocity X (px/s)
  vy: number;          // velocity Y (px/s)
  type: string;        // e.g. 'small', 'spread', 'laser', 'wide', 'enemy_basic'
  owner: BulletOwner;
  hp?: number;         // bullet strength if needed
};

// --- ENEMIES ---
export type Enemy = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  cooldown?: number;   // firing cooldown
};

// --- PLAYER + SHIPS ---
export type WeaponType = 'basic' | 'spread' | 'laser' | 'wide';

export type PlayerShip = {
  x: number;
  y: number;
  baseOffsetX?: number;   // formation offset
  baseOffsetY?: number;
  behavior?: 'static' | 'line' | 'trail' | 'orbit';
  cooldown?: number;      // firing cooldown
  weapon?: WeaponType;    // weapon type per ship
};

export type Player = {
  x: number;
  y: number;
  speed: number;          // movement speed
};

// --- FORMATIONS ---
export type FormationSpec = {
  id: string;
  behavior: 'static' | 'line' | 'trail' | 'orbit';
  ships: {
    x_norm: number;      // normalized position 0-100 (% of screen)
    y_norm: number;
  }[];
};

// --- ENEMY SPAWNS ---
export type EnemySpawnSpec = {
  t_ms: number;          // spawn time in ms
  x_norm: number;        // normalized 0–100
  y_norm: number;
  vx_px_s?: number;
  vy_px_s?: number;
  hp?: number;
};
