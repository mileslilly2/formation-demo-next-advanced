// phaser/systems/FormationManager.ts
import * as Phaser from 'phaser';
import Enemy from '../entities/Enemy';

type SpawnIn = any;

type NormalizedSpawn = {
  delayMs: number;
  x?: number;
  y?: number;
  x_norm?: number;
  y_norm?: number;
  vx?: number;
  vy?: number;
  size?: number;
  hp?: number;
  behavior?: 'static' | 'follow' | 'line' | 'orbit';
  path?: {
    type?: 'bezier' | 'spline';
    duration_ms?: number;
    points_norm?: Array<{ x: number; y: number }>;
  };
};

export default class FormationManager {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private enemyBullets?: Phaser.Physics.Arcade.Group;

  private indexFiles: string[] = [];
  private activeTimers: Phaser.Time.TimerEvent[] = [];
  private activeTweens: Phaser.Tweens.Tween[] = [];
  private idx = 0;

  constructor(
    scene: Phaser.Scene,
    enemiesGroup: Phaser.Physics.Arcade.Group,
    enemyBulletsGroup?: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.enemies = enemiesGroup;
    this.enemyBullets = enemyBulletsGroup;
  }

  // ---------- Index / cycling ----------

  /** Loads /public/formations/index.json with shape: { "files": ["a.json","b.json",...] } */
  async loadIndex(url = '/formations/index.json'): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`index fetch ${res.status}`);
      const json = await res.json();
      this.indexFiles = Array.isArray(json.files) ? json.files : [];
      this.idx = 0;
      console.log('[FormationManager] index files:', this.indexFiles);
    } catch (e) {
      console.warn('[FormationManager] loadIndex failed:', e);
      this.indexFiles = [];
    }
  }

  /** Spawns next file from index (if loaded) */
  async cycleNext(): Promise<void> {
    if (!this.indexFiles.length) return;
    const file = this.indexFiles[this.idx];
    this.idx = (this.idx + 1) % this.indexFiles.length;
    await this.loadAndScheduleFromFile(file);
  }

  // ---------- File loading & normalization ----------

  /** Load a formation file and schedule/emit according to its shape. */
  async loadAndScheduleFromFile(filename: string): Promise<void> {
    const url = `/formations/${filename}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`formation fetch failed: ${res.status}`);
    const json = await res.json();

    // Normalize to a list of spawns
    const spawns = this.normalizeToSpawns(json);
    if (!spawns.length) {
      console.warn('[FormationManager] no spawns in file:', filename, json);
      return;
    }

    // Clear old and schedule new
    this.clearActive();
    for (const s of spawns) {
      if (s.delayMs > 0) {
        const t = this.scene.time.addEvent({
          delay: s.delayMs,
          callback: () => this.spawnOne(s),
        });
        this.activeTimers.push(t);
      } else {
        this.spawnOne(s);
      }
    }
  }

  /** Accepts either {spawn}/ {spawns} / {ships, behavior} / raw arrays. */
  private normalizeToSpawns(json: any): NormalizedSpawn[] {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // 1) legacy/time-based
    let raw: SpawnIn[] = [];
    if (Array.isArray(json?.spawns)) raw = json.spawns;
    else if (Array.isArray(json?.spawn)) raw = json.spawn;
    else if (Array.isArray(json)) raw = json;

    if (raw.length) {
      return raw.map((s: any) => ({
        delayMs: Math.max(0, s.t ?? s.t_ms ?? s.delay ?? 0),
        x: typeof s.x === 'number' ? s.x : undefined,
        y: typeof s.y === 'number' ? s.y : undefined,
        x_norm: typeof s.x_norm === 'number' ? s.x_norm : undefined,
        y_norm: typeof s.y_norm === 'number' ? s.y_norm : undefined,
        vx: s.vx ?? 0,
        vy: s.vy ?? 40,
        size: s.size ?? 40,
        hp: s.hp ?? 1,
        behavior: s.behavior,
        path: s.path,
      }));
    }

    // 2) modern ships/behavior → immediate spawns (stagger slightly for visibility)
    if (Array.isArray(json?.ships)) {
      const behavior = json.behavior ?? 'static';
      return json.ships.map((ship: any, i: number) => ({
        delayMs: i * 120,
        x_norm: typeof ship.x_norm === 'number' ? ship.x_norm : undefined,
        y_norm: typeof ship.y_norm === 'number' ? ship.y_norm : undefined,
        x: typeof ship.x === 'number' ? ship.x : undefined,
        y: typeof ship.y === 'number' ? ship.y : undefined,
        vx: ship.vx ?? 0,
        vy: ship.vy ?? 40,
        size: ship.size ?? 40,
        hp: ship.hp ?? 1,
        behavior,
        path: ship.path,
      }));
    }

    // 3) nothing usable
    return [];
  }

  // ---------- Spawning / behaviors / paths ----------

  private spawnOne(s: NormalizedSpawn): void {
    const { width: w, height: h } = this.scene.scale;
    const x = (typeof s.x === 'number')
      ? s.x
      : (typeof s.x_norm === 'number' ? (s.x_norm / 100) * w : Phaser.Math.Between(32, w - 32));
    const y = (typeof s.y === 'number')
      ? s.y
      : (typeof s.y_norm === 'number' ? (s.y_norm / 100) * h : -40);

    let e = this.enemies.get(x, y, 'enemy') as Enemy | null;

    // If pool returned null, create a basic sprite so we ALWAYS see something.
    if (!e) {
      e = this.scene.physics.add.sprite(x, y, 'enemy') as unknown as Enemy;
      this.enemies.add(e);
    }

    // Initialize enemy (supports your Enemy.init or falls back)
    if (typeof (e as any).init === 'function') {
      (e as any).init(Date.now(), x, y, s.vx ?? 0, s.vy ?? 40, s.size ?? 40, s.hp ?? 1);
    } else {
      e.setPosition(x, y);
      e.setVelocity(s.vx ?? 0, s.vy ?? 40);
      e.setDisplaySize(s.size ?? 40, s.size ?? 40);
    }
    e.setActive(true).setVisible(true);

    // bullets from enemies if supported
    if (this.enemyBullets && typeof (e as any).startFiring === 'function') {
      try { (e as any).startFiring(this.scene, this.enemyBullets); } catch {}
    }

    // Behavior
    switch (s.behavior) {
      case 'follow': e.setVelocity(0, s.vy ?? 40); break;
      case 'line':   e.setVelocity(0, s.vy ?? 60); break;
      case 'orbit':  this.attachOrbit(e); break;
      default:       e.setVelocity(0, 0); break; // static
    }

    // Path (bezier/spline)
    if (s.path && Array.isArray(s.path.points_norm) && s.path.points_norm.length >= 2) {
      this.attachPath(e, s.path.points_norm, s.path.duration_ms ?? 4000, s.path.type);
    }
  }

  private attachOrbit(e: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite) {
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 4;
    const radius = 80 + Math.random() * 30;
    const start = Math.random() * 360;

    const tw = this.scene.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 6000,
      repeat: -1,
      onUpdate: (t) => {
        const a = Phaser.Math.DegToRad(start + (t.getValue() as number));
        (e as any).x = cx + Math.cos(a) * radius;
        (e as any).y = cy + Math.sin(a) * radius;
      }
    });
    this.activeTweens.push(tw);
  }

  private attachPath(
    e: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite,
    pointsNorm: Array<{ x: number; y: number }>,
    durationMs: number,
    type?: 'bezier' | 'spline'
  ) {
    const toPx = (p: { x: number; y: number }) => new Phaser.Math.Vector2(
      (p.x / 100) * this.scene.scale.width,
      (p.y / 100) * this.scene.scale.height
    );

    const pts = pointsNorm.map(toPx);

    let getPoint: (t: number) => Phaser.Math.Vector2;

    if (type === 'bezier' && pts.length === 4) {
      const curve = new Phaser.Curves.CubicBezier(pts[0], pts[1], pts[2], pts[3]);
      getPoint = (t) => curve.getPoint(t);
    } else {
      // generic spline for 2+ points
      const spline = new Phaser.Curves.Spline(pts.map(p => p.clone()));
      getPoint = (t) => spline.getPoint(t);
    }

    const tw = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: durationMs,
      onUpdate: (t) => {
        const v = getPoint(t.getValue() as number);
        (e as any).setPosition(v.x, v.y);
      }
    });
    this.activeTweens.push(tw);
  }

  // ---------- Public immediate spawn API ----------

  /** Spawn a formation object immediately (supports {ships,behavior}, raw arrays, or {spawn(s)} without times). */
  spawnFormationImmediate(formation: any): void {
    const spawns = this.normalizeToSpawns(formation)
      .map(s => ({ ...s, delayMs: 0 })); // immediate

    if (!spawns.length) return;
    this.clearActive();
    spawns.forEach(s => this.spawnOne(s));
  }

  // ---------- Cleanup ----------

  clearActive(): void {
    this.activeTimers.forEach(t => t.remove(false));
    this.activeTweens.forEach(tw => tw.stop());
    this.activeTimers = [];
    this.activeTweens = [];
    // stop & hide enemies
    this.enemies.getChildren().forEach(obj => {
      const e = obj as any;
      if (e && e.active) {
        if (typeof e.stopFiring === 'function') e.stopFiring();
        if (typeof e.kill === 'function') e.kill();
        else e.disableBody?.(true, true);
      }
    });
  }

  destroy(): void {
    this.clearActive();
    this.indexFiles = [];
  }
}
