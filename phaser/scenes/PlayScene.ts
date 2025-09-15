// phaser/scenes/PlayScene.ts
import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { scheduleFormationFromJson } from '../systems/FormationAdapter';

// Explicit Phaser particle types (fixes red squiggle)
import ParticleEmitterManager = Phaser.GameObjects.Particles.ParticleEmitterManager;
import ParticleEmitter = Phaser.GameObjects.Particles.ParticleEmitter;

let nextEnemyId = 1;

export class PlayScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys & { wasd?: any };
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private fireCooldown = 0;
  private score = 0;
  private particles?: ParticleEmitterManager;
  private explosionEmitter?: ParticleEmitter;
  private defaultWaveTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('play');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.bg = this.add.tileSprite(0, 0, width, height, 'bg').setOrigin(0, 0);

    // Expose for debugging
    (window as any).__PHASER_GAME__ = this.game;

    // Player
    const texture = this.textures.exists('insects') ? 'insects' : 'bg';
    this.player = this.physics.add.sprite(width * 0.5, height * 0.8, texture) as any;
    this.player.setDisplaySize(48, 48);
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(18);

    // Particles
    if (this.textures.exists('spark')) {
      this.particles = this.add.particles('spark');
      this.explosionEmitter = this.particles.createEmitter({
        speed: { min: 40, max: 160 },
        scale: { start: 0.6, end: 0 },
        lifespan: 400,
        quantity: 12,
        on: false,
      });
    }

    // Bullets
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 400,
      runChildUpdate: false,
    });

    // Enemies
    this.enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: 300,
      runChildUpdate: false,
    });

    // Input
    this.cursors = this.input.keyboard.createCursorKeys() as any;
    const wasd = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as any;
    this.cursors.wasd = wasd;

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitsEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHit, undefined, this);

    // Default wave
    this.defaultWaveTimer = this.time.addEvent({
      delay: 800,
      loop: true,
      callback: this.spawnEnemyWave,
      callbackScope: this,
    });

    // HUD → formation:selected
    this.game.events.on('formation:selected', this.onFormationSelected, this);

    // Score text
    this.add.text(8, 8, 'Score: 0', { fontSize: '16px', color: '#fff' }).setDepth(100).setName('scoreText');

    console.log('[PlayScene] created — player at', this.player.x, this.player.y);
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    // Background scroll
    this.bg.tilePositionY -= 60 * dt;

    // Movement
    const left = !!(this.cursors.left?.isDown || this.cursors.wasd?.a?.isDown);
    const right = !!(this.cursors.right?.isDown || this.cursors.wasd?.d?.isDown);
    const up = !!(this.cursors.up?.isDown || this.cursors.wasd?.w?.isDown);
    const down = !!(this.cursors.down?.isDown || this.cursors.wasd?.s?.isDown);

    const vx = (left ? -1 : 0) + (right ? 1 : 0);
    const vy = (up ? -1 : 0) + (down ? 1 : 0);

    this.player.setVelocity(vx * 280, vy * 280);

    // Firing
    this.fireCooldown -= dt;
    const fire = !!(this.cursors.space?.isDown || this.cursors.wasd?.fire?.isDown);
    if ((fire || this.input.activePointer.isDown) && this.fireCooldown <= 0) {
      this.fireCooldown = 0.12;
      this.fireBullet();
    }

    // Cleanup bullets
    this.bullets.children.each((obj: Phaser.GameObjects.GameObject) => {
      const b = obj as Bullet;
      if (b.active && (b.y < -40 || b.y > this.scale.height + 40)) {
        if (typeof b.kill === 'function') b.kill();
        else b.disableBody(true, true);
      }
    });

    // Cleanup enemies
    this.enemies.children.each((obj: Phaser.GameObjects.GameObject) => {
      const e = obj as Enemy;
      if (e.active && e.y > this.scale.height + 80) {
        if (typeof e.kill === 'function') e.kill();
        else e.disableBody(true, true);
      }
    });
  }

  private fireBullet() {
    const b = this.bullets.get() as Bullet | null;
    if (!b) return;
    b.init(this.player.x, this.player.y - 20, 0, -520, 'small', 'player');
  }

  private spawnEnemyWave() {
    const w = this.scale.width;
    for (let i = 0; i < 4; i++) {
      const x = Phaser.Math.Between(32, w - 32);
      const e = this.enemies.get() as Enemy | null;
      if (!e) continue;
      e.init(nextEnemyId++, x, -40, 0, Phaser.Math.Between(80, 150), 48, 1);
    }
  }

  private onBulletHitsEnemy(bObj: Phaser.GameObjects.GameObject, eObj: Phaser.GameObjects.GameObject) {
    const b = bObj as Bullet;
    const e = eObj as Enemy;

    if (b.owner === 'enemy') return; // no friendly fire

    const killed = e.receiveDamage(b.damage);

    if (this.explosionEmitter) this.explosionEmitter.explode(12, e.x, e.y);

    if (killed) {
      this.score += 100;
      const st = this.children.getByName('scoreText') as Phaser.GameObjects.Text;
      if (st) st.setText('Score: ' + this.score);
    }

    if (typeof b.kill === 'function') b.kill();
    else b.disableBody(true, true);
  }

  private onPlayerHit(_player: Phaser.GameObjects.GameObject, eObj: Phaser.GameObjects.GameObject) {
    const e = eObj as Enemy;
    console.log('[PlayScene] player hit by enemy', e.eid);
    if (this.explosionEmitter) this.explosionEmitter.explode(20, this.player.x, this.player.y);
    this.scene.restart(); // reset game
  }

  private async onFormationSelected(filename?: string) {
    if (!filename) return;
    console.log('[PlayScene] formation selected:', filename);

    try {
      if (this.defaultWaveTimer) {
        this.defaultWaveTimer.destroy();
        this.defaultWaveTimer = undefined;
      }

      await scheduleFormationFromJson(this, filename, (spec) => {
        const e = this.enemies.get() as Enemy | null;
        if (!e) return;
        e.init(nextEnemyId++, spec.x, spec.y, spec.vx ?? 0, spec.vy ?? 120, spec.size ?? 48, spec.hp ?? 1);
      });
    } catch (err) {
      console.error('[PlayScene] formation load failed', err);
    }
  }

  shutdown() {
    this.game.events.off('formation:selected', this.onFormationSelected, this);
  }
}
