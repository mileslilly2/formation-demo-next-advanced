// phaser/systems/CollisionManager.ts
import * as Phaser from 'phaser';
import Bullet from '../entities/Bullet';
import Enemy from '../entities/Enemy';

type Callbacks = {
  onPlayerHit?: (payload?: any) => void;
  onEnemyKilled?: (enemy?: Enemy, points?: number) => void;
};

export class CollisionManager {
  private scene: Phaser.Scene;
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private bullets: Phaser.Physics.Arcade.Group;
  private enemies: Phaser.Physics.Arcade.Group;
  private enemyBullets?: Phaser.Physics.Arcade.Group;
  private callbacks: Callbacks;
  private score = 0;

  private overlapPlayerEnemy?: Phaser.Physics.Arcade.Collider;
  private overlapBulletEnemy?: Phaser.Physics.Arcade.Collider;
  private overlapPlayerEnemyBullets?: Phaser.Physics.Arcade.Collider;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    bullets: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    enemyBullets?: Phaser.Physics.Arcade.Group,
    callbacks: Callbacks = {}
  ) {
    this.scene = scene;
    this.player = player;
    this.bullets = bullets;
    this.enemies = enemies;
    this.enemyBullets = enemyBullets;
    this.callbacks = callbacks;
  }

  /** wire up overlaps and return */
  setup(): void {
    // player bullets -> enemies
    // NOTE: callback parameters are untyped to avoid generic inference mismatch;
    // we cast inside the body to the expected classes.
    this.overlapBulletEnemy = this.scene.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bObj, eObj) => {
        const b = bObj as Bullet;
        const e = eObj as Enemy;
        if (!b.active || !e.active) return;
        if (b.owner === 'enemy') return;

        const killed = typeof e.receiveDamage === 'function' ? e.receiveDamage(b.damage) : false;

        if (typeof b.kill === 'function') b.kill();
        else b.disableBody(true, true);

        if (killed) {
          this.score += 100;
          if (this.callbacks.onEnemyKilled) this.callbacks.onEnemyKilled(e, 100);
        }
      },
      undefined,
      this
    );

    // enemy bullets -> player
    if (this.enemyBullets) {
      this.overlapPlayerEnemyBullets = this.scene.physics.add.overlap(
        this.player,
        this.enemyBullets,
        (_p, bObj) => {
          const b = bObj as Bullet;
          if (!b.active) return;
          if (typeof b.kill === 'function') b.kill();
          else b.disableBody(true, true);
          if (this.callbacks.onPlayerHit) this.callbacks.onPlayerHit({ by: 'bullet' });
        },
        undefined,
        this
      );
    }

    // player -> enemy (sprite collision)
    this.overlapPlayerEnemy = this.scene.physics.add.overlap(
      this.player,
      this.enemies,
      (_p, eObj) => {
        const e = eObj as Enemy;
        if (!e.active) return;
        if (this.callbacks.onPlayerHit) this.callbacks.onPlayerHit({ by: 'enemy', enemy: e });
      },
      undefined,
      this
    );
  }

  performCleanup(): void {
    const h = this.scene.scale.height;

    this.bullets.getChildren().forEach((obj) => {
      const b = obj as Bullet;
      if (b.active && (b.y < -40 || b.y > h + 40)) {
        if (typeof b.kill === 'function') b.kill();
        else b.disableBody(true, true);
      }
    });

    if (this.enemyBullets) {
      this.enemyBullets.getChildren().forEach((obj) => {
        const b = obj as Bullet;
        if (b.active && b.y > h + 40) {
          if (typeof b.kill === 'function') b.kill();
          else b.disableBody(true, true);
        }
      });
    }

    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e.active && e.y > h + 120) {
        if (typeof e.kill === 'function') e.kill();
        else e.disableBody(true, true);
      }
    });
  }

  getScore(): number {
    return this.score;
  }

  destroy(): void {
    try {
      if (this.overlapBulletEnemy) this.scene.physics.world.removeCollider(this.overlapBulletEnemy);
      if (this.overlapPlayerEnemyBullets) this.scene.physics.world.removeCollider(this.overlapPlayerEnemyBullets);
      if (this.overlapPlayerEnemy) this.scene.physics.world.removeCollider(this.overlapPlayerEnemy);
    } catch {
      // ignore
    }
  }
}

export default CollisionManager;
