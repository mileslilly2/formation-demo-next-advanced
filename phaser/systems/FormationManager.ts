// phaser/systems/FormationManager.ts
import * as Phaser from 'phaser';
import Enemy from '../entities/Enemy';

/**
 * FormationManager
 *
 * Responsibilities:
 * - load formation index or a specific formation file
 * - spawn a formation (immediately or schedule time-based spawns if entries include `t`)
 * - clear existing spawned formation (stop firing, disable enemies, remove scheduled events/tweens)
 *
 * Usage:
 *   const fm = new FormationManager(scene, enemiesGroup, enemyBulletsGroup);
 *   await fm.loadIndex();                // optional (falls back to cache.json)
 *   fm.cycleNext();                      // spawn next formation
 *   fm.spawnFormation(formationObject); // spawn a JS object directly
 *   fm.destroy();                        // cleanup
 */
export class FormationManager {
  private scene: Phaser.Scene;
  private enemiesGroup: Phaser.Physics.Arcade.Group;
  private enemyBulletsGroup?: Phaser.Physics.Arcade.Group;
  private formations: any[] = [];
  private index = 0;
  private activeTimers: Phaser.Time.TimerEvent[] = [];
  private activeTweens: Phaser.Tweens.Tween[] = [];

  constructor(
    scene: Phaser.Scene,
    enemiesGroup: Phaser.Physics.Arcade.Group,
    enemyBulletsGroup?: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.enemiesGroup = enemiesGroup;
    this.enemyBulletsGroup = enemyBulletsGroup;
    // Try to read from cache.json if it was preloaded
    const cached = (this.scene.cache && (this.scene.cache.json as any).get) ? (this.scene.cache.json.get('formations')?.formations ?? []) : [];
    if (Array.isArray(cached) && cached.length > 0) {
      this.formations = cached;
    }
  }

  /** Load the formation index from /public/formations/index.json (async) */
  async loadIndex(path = '/formations/index.json'): Promise<void> {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('failed to load formations index: ' + res.status);
      const json = await res.json();
      this.formations = json.formations ?? [];
    } catch (err) {
      console.warn('[FormationManager] loadIndex failed:', err);
      this.formations = this.formations ?? [];
    }
  }

  /** Load a single formation file (with spawns array) and schedule it */
  async loadAndScheduleFromFile(filename: string): Promise<void> {
    const url = `/formations/${filename}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('formation fetch failed: ' + res.status);
    const json = await res.json();
    if (Array.isArray(json.spawns)) {
      // schedule spawns (use spawn spec shape {t, x, y, vx, vy, size, hp})
      this.clearActive();
      for (const spawn of json.spawns) {
        const delay = Math.max(0, spawn.t ?? 0);
        const t = this.scene.time.addEvent({
          delay,
          callback: () => this.spawnSpec(spawn),
        });
        this.activeTimers.push(t);
      }
    } else {
      console.warn('[FormationManager] file has no spawns array:', filename);
    }
  }

  /** Cycle to next formation in the loaded index (spawns immediately) */
  cycleNext(): void {
    if (!this.formations || this.formations.length === 0) return;
    const formation = this.formations[this.index];
    this.index = (this.index + 1) % this.formations.length;
    this.clearActive();
    this.spawnFormationImmediate(formation);
  }

  /** Spawn a formation object immediately (no scheduling) */
  spawnFormationImmediate(formation: any): void {
    if (!formation || !Array.isArray(formation.ships) && !Array.isArray(formation)) return;
    const ships = Array.isArray(formation.ships) ? formation.ships : (Array.isArray(formation) ? formation : []);
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = w / 2;
    const cy = h / 4;

    // spawn each ship
    ships.forEach((ship: any, i: number) => {
      const x = (ship.x_norm ?? ship.x ?? 50) / 100 * w;
      const y = (ship.y_norm ?? ship.y ?? 10) / 100 * h;
      const e = this.enemiesGroup.get(x, y, 'enemy') as Enemy | null;
      if (!e) return;
      e.init(Date.now() + i, x, y, ship.vx ?? 0, ship.vy ?? 40, ship.size ?? 40, ship.hp ?? 1);
      if (this.enemyBulletsGroup && typeof e.startFiring === 'function') {
        e.startFiring(this.scene, this.enemyBulletsGroup);
      }

      // attach simple behaviors (tween-based for orbit)
      const behavior = formation.behavior ?? 'static';
      if (behavior === 'orbit') {
        const tween = this.scene.tweens.addCounter({
          from: 0,
          to: 360,
          duration: 6000,
          repeat: -1,
          onUpdate: (twn) => {
            const ang = Phaser.Math.DegToRad((twn.getValue() as number) + i * 30);
            e.x = cx + Math.cos(ang) * (80 + i * 4);
            e.y = cy + Math.sin(ang) * (80 + i * 4);
          },
        });
        this.activeTweens.push(tween);
      } else if (behavior === 'follow') {
        e.setVelocity(0, ship.vy ?? 40);
      } else if (behavior === 'line') {
        e.setVelocity(0, ship.vy ?? 60);
      } else { // static
        e.setVelocity(0, 0);
      }
    });
  }

  /** Spawn formation (if formation object uses `spawns` with times, schedule them) */
  spawnFormation(formationOrArray: any): void {
    // if it appears to be a pre-scheduled 'spawns' array with times, schedule each spawn
    if (formationOrArray && Array.isArray(formationOrArray.spawns)) {
      this.clearActive();
      for (const spawn of formationOrArray.spawns) {
        const delay = Math.max(0, spawn.t ?? 0);
        const t = this.scene.time.addEvent({
          delay,
          callback: () => this.spawnSpec(spawn),
        });
        this.activeTimers.push(t);
      }
      return;
    }
    // otherwise, spawn immediately
    this.spawnFormationImmediate(formationOrArray);
  }

  /** spawn a single spawn-spec object {x,y,vx,vy,size,hp} */
  spawnSpec(spec: any) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const x = (typeof spec.x === 'number') ? spec.x : Phaser.Math.Between(32, w - 32);
    const y = (typeof spec.y === 'number') ? spec.y : (spec.y ?? -40);
    const e = this.enemiesGroup.get(x, y, 'enemy') as Enemy | null;
    if (!e) return;
    e.init(Date.now(), x, y, spec.vx ?? 0, spec.vy ?? 120, spec.size ?? 48, spec.hp ?? 1);
    if (this.enemyBulletsGroup && typeof e.startFiring === 'function') {
      e.startFiring(this.scene, this.enemyBulletsGroup);
    }
  }

  /** Stop & clear any active timers and tweens, stop firing and kill existing enemies */
  clearActive(): void {
    // stop timers
    this.activeTimers.forEach((t) => t.remove(false));
    this.activeTimers = [];

    // stop tweens
    this.activeTweens.forEach((tw) => tw.stop());
    this.activeTweens = [];

    // stop enemies and their firing
    this.enemiesGroup.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e && e.active) {
        if (typeof e.stopFiring === 'function') e.stopFiring();
        if (typeof e.kill === 'function') e.kill();
        else e.disableBody(true, true);
      }
    });
  }

  /** destroy manager and free resources */
  destroy(): void {
    this.clearActive();
    this.formations = [];
  }
}

export default FormationManager;
