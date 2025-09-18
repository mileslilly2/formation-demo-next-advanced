// phaser/systems/CollisionManager.ts
import * as Phaser from 'phaser';
import Bullet from '../entities/Bullet';
import Enemy from '../entities/Enemy';
import Player from '../entities/Player';

export default class CollisionManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupCollisions(
    player: Player,
    bullets: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    enemyBullets: Phaser.Physics.Arcade.Group,
    explosionEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
  ) {
    const physics = this.scene.physics;

    // Player bullets -> enemies
    physics.add.overlap(bullets, enemies, (bObj, eObj) => {
      const b = bObj as Bullet;
      const e = eObj as Enemy;
      if (!b.active || !e.active) return;
      if (b.owner === 'enemy') return;

      b.kill();
      const killed = e.takeDamage(b.damage);
      if (killed && explosionEmitter) explosionEmitter.explode(10, e.x, e.y);
    });

    // Player -> enemies
    physics.add.overlap(player, enemies, (_p, eObj) => {
      const e = eObj as Enemy;
      player.takeDamage(e.hp ?? 1);
    });

    // Player -> enemy bullets
    physics.add.overlap(player, enemyBullets, (_p, bObj) => {
      const b = bObj as Bullet;
      if (!b.active) return;
      b.kill();
      player.takeDamage(b.damage);
    });
  }
}
