import * as Phaser from "phaser";
import Player from "../entities/Player";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";
import FormationManager from "../systems/FormationManager";

export default class PlayScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Player;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private formationManager!: FormationManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private formationFiles: string[] = [];
  private currentFormationIndex: number = 0;

  constructor() {
    super("play");
  }

  preload() {
    console.log(">>> PRELOAD running");

    this.load.image("bg", "/sprites/bg.png");
    this.load.image("player", "/sprites/player.png");
    this.load.image("bullet", "/sprites/bullet.png");
    this.load.image("enemy", "/sprites/enemy.png");
    this.load.once('complete', async () => {
  try {
    const texKeys = (this.textures as any).getTextureKeys?.() || [];
    console.log('[ASSET][textures]', texKeys);
    console.log('[ASSET][json]', this.cache.json.getKeys?.() || []);
    console.log('[ASSET][audio]', this.cache.audio?.getKeys?.() || []);

    // HEAD-check a few critical assets
    const checkList: Array<[string, string]> = [
      ['bg', '/sprites/bg.png'],
      ['player', '/sprites/player.png'],
      ['enemy', '/sprites/enemy.png'],
      ['bullet', '/sprites/bullet.png'],
    ];

      for (const [key, url] of checkList) {
        try {
          const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
          if (!res.ok) throw new Error(String(res.status));
          console.log(`[ASSET OK] ${key} -> ${new URL(url, location.origin).href}`);
        } catch (e) {
          console.error(`[ASSET MISS] ${key} -> ${url}`, e);
        }
      }
    } catch (e) {
    console.error('[ASSET] sanity logger error', e);
  }
});

  }

  create() {
    console.log(">>> CREATE running");

    const { width, height } = this.scale;

    // --- Background ---
    this.bg = this.add
      .tileSprite(0, 0, width, height, "bg")
      .setOrigin(0, 0)
      .setDepth(0);

    // --- Player ---
    this.player = new Player(this, width * 0.5, height * 0.8);

    // --- Controls ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // --- Groups ---
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });

    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });

    this.enemyBullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });

    // --- Formation Manager ---
    this.formationManager = new FormationManager(
      this,
      this.enemies,
      this.enemyBullets
    );

    // --- HUD ---
    this.scoreText = this.add
      .text(12, 12, "Score: 0", { color: "#fff", fontSize: "16px" })
      .setDepth(1000);

    // --- Collisions ---
    this.setupCollisions();

    // --- Load formations from index.json ---
    this.loadFormationsFromIndex();
  }

  update(_time: number, delta: number) {
    if (!this.player) return;

    // Background scroll
    this.bg.tilePositionY -= delta * 0.06;

    // Player movement + shooting
    this.handlePlayerControls();
  }

  // --- Player controls ---
  private handlePlayerControls() {
    this.player.setVelocity(0);
    const speed = 200;

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed);
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.player.fire(this.bullets);
    }
  }

  // --- Collisions ---
  private setupCollisions() {
    // bullets -> enemies
    const onBulletHitsEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
      (bObj, eObj) => {
        const bullet = bObj as unknown as Bullet;
        const enemy = eObj as unknown as Enemy;

        this.bullets.killAndHide(bullet);
        bullet.setActive(false).setVisible(false);
        bullet.setVelocity?.(0, 0);

        enemy.takeDamage?.(1);

        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
      };

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      onBulletHitsEnemy,
      undefined,
      this
    );

    // enemyBullets -> player
    const onEnemyBulletHitsPlayer: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
      (_pObj, bObj) => {
        const bullet = bObj as unknown as Bullet;
        this.enemyBullets.killAndHide(bullet);
        bullet.setActive(false).setVisible(false);
        bullet.setVelocity?.(0, 0);

        this.player.takeDamage(1);
      };

    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      onEnemyBulletHitsPlayer,
      undefined,
      this
    );

    // player -> enemies (ramming damage)
    const onPlayerHitsEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
      (_pObj, eObj) => {
        const enemy = eObj as unknown as Enemy;
        this.player.takeDamage(1);

        this.enemies.killAndHide(enemy);
        enemy.setActive(false).setVisible(false);
        enemy.setVelocity?.(0, 0);
      };

    this.physics.add.overlap(
      this.player,
      this.enemies,
      onPlayerHitsEnemy,
      undefined,
      this
    );
  }

  // --- Load formations sequentially from index.json ---
  private async loadFormationsFromIndex(): Promise<void> {
    try {
      const res = await fetch("/formations/index.json");
      const json = await res.json();
      this.formationFiles = json.files ?? [];

      if (!this.formationFiles.length) {
        console.warn("[PlayScene] No formation files in index.json");
        return;
      }

      console.log("[PlayScene] Formation files loaded:", this.formationFiles);
      this.currentFormationIndex = 0;

      // Start a timer to load next formation every 10s
      this.time.addEvent({
        delay: 10000,
        loop: true,
        callback: () => {
          if (this.currentFormationIndex < this.formationFiles.length) {
            const nextFile = this.formationFiles[this.currentFormationIndex];
            console.log(`[PlayScene] Loading formation: ${nextFile}`);
            this.formationManager.loadAndScheduleFromFile(nextFile);
            this.currentFormationIndex++;
          } else {
            console.log("[PlayScene] All formations loaded.");
          }
        },
      });
    } catch (err) {
      console.error("[PlayScene] Failed to load index.json", err);
    }
  }
}
