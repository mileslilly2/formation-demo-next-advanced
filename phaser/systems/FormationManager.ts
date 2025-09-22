import * as Phaser from "phaser";
import Enemy from "../entities/Enemy";
import Bullet from "../entities/Bullet";

export default class FormationManager {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private enemyBullets: Phaser.Physics.Arcade.Group;

  // track only timers created by this manager
  private spawnTimers: Phaser.Time.TimerEvent[] = [];

  constructor(
    scene: Phaser.Scene,
    enemies: Phaser.Physics.Arcade.Group,
    enemyBullets: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.enemyBullets = enemyBullets;
  }

  async loadAndScheduleFromFile(filename: string): Promise<void> {
    try {
      const url = `/formations/${filename}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load formation file: ${url}`);
      const json = await res.json();

      // handle multiple schema types
      const spawns: any[] =
        Array.isArray(json?.spawns) ? json.spawns :
        Array.isArray(json?.wave) ? json.wave :
        Array.isArray(json?.spawn) ? json.spawn : [];

      if (!spawns.length) {
        console.warn("[FormationManager] No recognized spawns in", filename);
        return;
      }

      // clear only timers from the previous wave
      this.spawnTimers.forEach((t) => t.remove(false));
      this.spawnTimers = [];

      spawns.forEach((spawn, idx) => {
        // support t_ms, t, or delay
        const delay = Math.max(0, spawn.t_ms ?? spawn.t ?? spawn.delay ?? 0);

        const timer = this.scene.time.addEvent({
          delay,
          callback: () => this.spawnEnemy(spawn, idx),
          callbackScope: this,
        });
        this.spawnTimers.push(timer);
      });

      console.log(
        `[FormationManager] Scheduled ${spawns.length} spawns from ${filename}`
      );
    } catch (err) {
      console.error("[FormationManager] Error loading formation file", err);
    }
  }

  private spawnEnemy(spec: any, idx: number) {
    // normalized positions (0–100) fallback to raw pixels
    const x =
      spec.x_norm !== undefined
        ? (spec.x_norm / 100) * this.scene.scale.width
        : typeof spec.x === "number"
        ? spec.x
        : Phaser.Math.Between(32, this.scene.scale.width - 32);

    const y =
      spec.y_norm !== undefined
        ? (spec.y_norm / 100) * this.scene.scale.height
        : spec.y ?? -40;

    // velocity in px/s
    const vx = spec.vx_px_s ?? spec.vx ?? 0;
    const vy = spec.vy_px_s ?? spec.vy ?? spec.speed ?? 120;

    const size = spec.size ?? 48;
    const hp = spec.hp ?? 1;

    const enemy = this.enemies.get(x, y, "enemy") as Enemy;
    if (!enemy) return;
    const type = spec.type ?? "scout";

    enemy.init(idx, x, y, vx, vy, size, hp, type);
    enemy.startFiring(this.scene, this.enemyBullets);

    console.log("[FormationManager] Spawned enemy", idx, {
      x,
      y,
      vx,
      vy,
      size,
      hp,
    });
  }
}
