// phaser/scenes/PlayScene.ts
import * as Phaser from 'phaser';
import Bullet from '../entities/Bullet';
import Enemy from '../entities/Enemy';
import FormationManager from '../systems/FormationManager';

/**
 * PlayScene
 *
 * - HUD buttons / FormationManager -> enemy waves
 * - F key -> cycles player formations (insects.json) and spawns allies that follow the player
 */

type AllyEntry = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  offset: Phaser.Math.Vector2;         // desired offset from player for follow/static/line
  behavior: string;                    // 'orbit' | 'follow' | 'static' | 'line'
  orbitBaseAngle?: number;             // degrees
  orbitRadius?: number;
};

export class PlayScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;

  private fireCooldown = 0;
  private formationKey!: Phaser.Input.Keyboard.Key;
  private explosionEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Enemy formations (HUD)
  private formationManager?: FormationManager;

  // Player formations (F key)
  private playerFormations: any[] = [];
  private currentPlayerFormationIdx = 0;

  // Allies who follow the player
  private allies: AllyEntry[] = [];

  constructor() {
    super('play');
  }

  preload() {
    // sprites / atlas
    this.load.image('bg', '/sprites/bg.png');
    this.load.image('player', '/sprites/player.png');
    this.load.image('enemy', '/sprites/enemy.png');
    this.load.image('bullet', '/sprites/bullet.png');
    this.load.atlas('flares', '/sprites/flares.png', '/sprites/flares.json');

    // formation files
    this.load.json('formation_index', '/formations/index.json'); // enemy waves
    this.load.json('player_formations', '/formations/insects.json'); // player formations
  }

  create() {
    console.log('[PlayScene] create');
    const { width, height } = this.scale;

    // background first so it's behind everything
    this.add.rectangle(0, 0, width, height, 0x061025).setOrigin(0, 0);
    this.bg = this.add.tileSprite(0, 0, width, height, 'bg').setOrigin(0, 0);

    // hint text
    this.add.text(12, 14, 'Arrows = move • Space = fire • F = cycle player formations', {
      color: '#9fb0c7',
    });

    // player
    this.player = this.physics.add.sprite(width * 0.5, height * 0.8, 'player');
    this.player.setDisplaySize(48, 48);
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(18);

    // groups
    this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 300 });
    this.enemies = this.physics.add.group({ classType: Enemy, maxSize: -1 });
    this.enemyBullets = this.physics.add.group({ classType: Bullet, maxSize: 400 });

    // input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.formationKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // collisions
    this.physics.add.overlap(this.bullets, this.enemies, (bObj, eObj) => {
      const b = bObj as Bullet;
      const e = eObj as Enemy;
      if (!b.active || !e.active) return;
      if (b.owner === 'enemy') return;
      b.kill ? b.kill() : b.disableBody(true, true);
      const killed = typeof e.receiveDamage === 'function' ? e.receiveDamage((b as any).damage ?? 1) : false;
      if (killed && this.explosionEmitter) this.explosionEmitter.explode(10, e.x, e.y);
    });

    this.physics.add.overlap(this.player, this.enemies, () => this.onPlayerHit());
    this.physics.add.overlap(this.player, this.enemyBullets, (_p, bObj) => {
      const b = bObj as Bullet;
      if (b.active) (b.kill ? b.kill() : b.disableBody(true, true));
      this.onPlayerHit();
    });

    // particles
    this.explosionEmitter = this.add.particles(0, 0, 'flares', {
      frame: 'red',
      lifespan: 450,
      speed: { min: 100, max: 220 },
    });

    // FormationManager for enemy waves
    this.formationManager = new FormationManager(this, this.enemies, this.enemyBullets);

    // load player formations (insects.json)
    const pf = this.cache.json.get('player_formations');
    this.playerFormations = Array.isArray(pf?.formations) ? pf.formations : [];
    console.log('[PlayScene] playerFormations:', this.playerFormations.map((f: any) => f.id));

    // HUD -> enemy waves
    this.game.events.on('formation:selected', (filename?: string) => {
      if (filename && this.formationManager) {
        console.log('[PlayScene] HUD selected enemy formation:', filename);
        this.formationManager.loadAndScheduleFromFile(filename).catch((e) => console.warn(e));
      }
    });

    // Optionally auto-load first enemy wave for testing
    const idx = this.cache.json.get('formation_index');
    const files = Array.isArray(idx?.files) ? idx.files : [];
    if (files.length > 0) {
      this.formationManager.loadAndScheduleFromFile(files[0]).catch((e) => console.warn(e));
    }
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    // background scroll
    this.bg.tilePositionY -= 60 * dt;

    // player movement
    const speed = 280;
    const vx = (this.cursors.left?.isDown ? -1 : 0) + (this.cursors.right?.isDown ? 1 : 0);
    const vy = (this.cursors.up?.isDown ? -1 : 0) + (this.cursors.down?.isDown ? 1 : 0);
    this.player.setVelocity(vx * speed, vy * speed);

    // firing (player)
    this.fireCooldown -= dt;
    const playerFired = (this.cursors.space?.isDown || this.input.activePointer.isDown) && this.fireCooldown <= 0;
    if (playerFired) {
      this.fireCooldown = 0.15;
      this.fireBullet();
      // make allies fire in sync
      this.fireAllies();
    }

    // cycle player formations with F
    if (Phaser.Input.Keyboard.JustDown(this.formationKey)) {
      if (this.playerFormations.length > 0) {
        this.currentPlayerFormationIdx = (this.currentPlayerFormationIdx + 1) % this.playerFormations.length;
        const formation = this.playerFormations[this.currentPlayerFormationIdx];
        console.log('[PlayScene] apply player formation:', formation.id);
        this.applyPlayerFormation(formation);
      }
    }

    // Update ally positions (follow the player)
    this.updateAllies(dt);

    // cleanup off-screen bullets/enemies (optional)
    const h = this.scale.height;
    this.bullets.getChildren().forEach((o) => {
      const b = o as Bullet;
      if (b.active && (b.y < -32 || b.y > h + 32)) b.kill ? b.kill() : b.disableBody(true, true);
    });
    this.enemyBullets.getChildren().forEach((o) => {
      const b = o as Bullet;
      if (b.active && b.y > h + 32) b.kill ? b.kill() : b.disableBody(true, true);
    });
  }

  private fireBullet() {
    const b = this.bullets.get(this.player.x, this.player.y - 20, 'bullet') as Bullet;
    if (!b) return;
    b.init(this.player.x, this.player.y - 20, 0, -400, 'bullet', 'player');
  }

  // ---------- Player formation helpers ----------

  private applyPlayerFormation(formation: any) {
    // Remove previous allies cleanly
    this.allies.forEach((a) => {
      try {
        a.sprite.destroy();
      } catch {}
    });
    this.allies = [];

    const w = this.scale.width;
    const h = this.scale.height;

    // We'll compute offsets relative to the player. Use a formation box size relative to screen
    const boxW = Math.max(120, w * 0.3);   // width of formation area (pixels)
    const boxH = Math.max(80, h * 0.18);   // height of formation area (pixels)

    formation.ships.forEach((ship: any, i: number) => {
      // convert x_norm/y_norm (0-100) to an offset centered at (0,0)
      const nx = (ship.x_norm ?? ship.x ?? 50);
      const ny = (ship.y_norm ?? ship.y ?? 50);
      const offsetX = ((nx - 50) / 100) * boxW;
      const offsetY = ((ny - 50) / 100) * boxH;

      // create a physics sprite for ally so collisions or future behaviors can work
      const sx = this.player.x + offsetX;
      const sy = this.player.y + offsetY;
      const allySprite = this.physics.add.sprite(sx, sy, 'player');
      allySprite.setDisplaySize(32, 32);
      allySprite.setTint(0x00ffcc);
      allySprite.setData('isAlly', true);

      const entry: AllyEntry = {
        sprite: allySprite,
        offset: new Phaser.Math.Vector2(offsetX, offsetY),
        behavior: formation.behavior ?? 'follow',
      };

      // If orbit, set orbit parameters
      if (entry.behavior === 'orbit') {
        entry.orbitBaseAngle = (i / Math.max(1, formation.ships.length)) * 360;
        entry.orbitRadius = 40 + (i * 8); // gradual radius spread
      }

      this.allies.push(entry);
    });
  }

  private updateAllies(dt: number) {
    if (!this.allies.length) return;

    // time-based value for orbit rotations
    const t = this.time.now / 1000; // seconds

    const lerpFactor = 0.12; // smoothing for following; 0..1

    this.allies.forEach((entry) => {
      const s = entry.sprite;
      if (!s.active) return;

      let targetX = this.player.x + entry.offset.x;
      let targetY = this.player.y + entry.offset.y;

      if (entry.behavior === 'orbit') {
        const base = entry.orbitBaseAngle ?? 0;
        const radius = entry.orbitRadius ?? 60;
        // spin speed in deg/sec
        const speedDeg = 60;
        const ang = Phaser.Math.DegToRad(base + t * speedDeg);
        targetX = this.player.x + Math.cos(ang) * radius;
        targetY = this.player.y + Math.sin(ang) * radius;
      } else if (entry.behavior === 'follow' || entry.behavior === 'line' || entry.behavior === 'static') {
        // for 'line' you may offset more in Y (we already have offset)
        // 'static' will still follow the player but with very tight lerp (so it "sticks")
      }

      // Smoothly move ally towards target
      s.x = Phaser.Math.Linear(s.x, targetX, lerpFactor);
      s.y = Phaser.Math.Linear(s.y, targetY, lerpFactor);
    });
  }

  private fireAllies() {
    if (!this.allies.length) return;
    this.allies.forEach((entry) => {
      const s = entry.sprite;
      if (!s.active) return;
      const b = this.bullets.get(s.x, s.y - 20, 'bullet') as Bullet;
      if (!b) return;
      b.init(s.x, s.y - 20, 0, -400, 'bullet', 'player');
    });
  }

  // ---------- misc ----------
  private onPlayerHit() {
    console.log('[PlayScene] player hit -> back to menu');
    this.scene.start('menu');
  }
}

export default PlayScene;
