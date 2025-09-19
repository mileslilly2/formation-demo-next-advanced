// phaser/scenes/PlayScene.ts
import * as Phaser from "phaser";
import Player from "../entities/Player";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";
import FormationManager from "../systems/FormationManager";
import AllyManager from "../systems/AllyManager";
import { logFlags } from '../../src/flags';

export default class PlayScene extends Phaser.Scene {
  private allyManager!: AllyManager;
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Player;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private formationManager!: FormationManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private fKey!: Phaser.Input.Keyboard.Key;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private formationFiles: string[] = [];
  private currentFormationIndex: number = 0;

  // ally loader state
  private allyFormations: any[] = [];
  private allyFormationIndex: number = 0;

  // caching and per-file indices (if you still use them)
  private formationFileCache: Record<string, any[]> = {};
  private formationIndexByFile: Record<string, number> = {};

  constructor() {
    super("play");
  }

  preload() {
    // same as before
    this.load.image("bg", "/sprites/bg.png");
    this.load.image("player", "/sprites/player.png");
    this.load.image("bullet", "/sprites/bullet.png");
    this.load.image("enemy", "/sprites/enemy.png");
  }

  create() {
    logFlags();
    console.log(">>> CREATE running");

    // get initial size
    const { width, height } = this.scale;

    // --- Background ---
    this.bg = this.add
      .tileSprite(0, 0, width, height, "bg")
      .setOrigin(0, 0)
      .setDepth(0);

    // --- Player ---
    this.player = new Player(this, width * 0.5, height * 0.8);

    // --- Ally manager ---
    this.allyManager = new AllyManager(this, this.player);

    // --- Controls ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // focus canvas
    const canvas = (this.game.canvas as HTMLCanvasElement | null);
    if (canvas) {
      canvas.tabIndex = 0;
      canvas.style.outline = 'none';
      try { canvas.focus(); } catch (e) { /* ignore */ }
    }

    // --- Groups ---
    this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });

    // --- Formation Manager ---
    this.formationManager = new FormationManager(this, this.enemies, this.enemyBullets);

    // --- HUD ---
    this.scoreText = this.add.text(12, 12, "Score: 0", { color: "#fff", fontSize: "16px" }).setDepth(1000);

    // --- Collisions ---
    this.setupCollisions();

    // --- Load formations / allies ---
    this.loadEnemyFormationsFromIndex();
    this.loadAllyFormations();

    // --- Resize handling ---
    // Register resize event and call once to initialize layout
    this.scale.on('resize', this.handleResize, this);
    this.handleResize(this.scale.gameSize);

    // --- F key: cycle ally formations (operates only on allyFormations)
    this.input.keyboard.on('keydown-F', () => {
      if (!this.allyFormations.length) return;
      this.allyFormationIndex = (this.allyFormationIndex + 1) % this.allyFormations.length;
      const formation = this.allyFormations[this.allyFormationIndex];
      console.log(`[PlayScene] Ally cycle → ${formation.id ?? '<no-id>'}`);
      this.allyManager.applyFormation(formation);
    });
  }

  // cleanup listener on shutdown
  shutdown() {
    this.scale.off('resize', this.handleResize, this);
  }

  update(_time: number, delta: number) {
    if (!this.player) return;

    // Background scroll
    this.bg.tilePositionY -= delta * 0.06;

    // Player controls/shooting
    this.handlePlayerControls();

    // update allies each frame
    this.allyManager.update();
  }

  // --- Player controls ---
  private handlePlayerControls() {
    this.player.setVelocity(0);
    const speed = 200;
    if (this.cursors.left?.isDown) this.player.setVelocityX(-speed);
    else if (this.cursors.right?.isDown) this.player.setVelocityX(speed);
    if (this.cursors.up?.isDown) this.player.setVelocityY(-speed);
    else if (this.cursors.down?.isDown) this.player.setVelocityY(speed);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.player.fire(this.bullets);
  }

  // --- Collisions (unchanged) ---
  private setupCollisions() {
    const onBulletHitsEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bObj, eObj) => {
      const bullet = bObj as unknown as Bullet;
      const enemy = eObj as unknown as Enemy;
      this.bullets.killAndHide(bullet);
      bullet.setActive(false).setVisible(false);
      bullet.setVelocity?.(0, 0);
      enemy.takeDamage?.(1);
      this.score += 10;
      this.scoreText.setText(`Score: ${this.score}`);
    };

    this.physics.add.overlap(this.bullets, this.enemies, onBulletHitsEnemy, undefined, this);

    const onEnemyBulletHitsPlayer: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_pObj, bObj) => {
      const bullet = bObj as unknown as Bullet;
      this.enemyBullets.killAndHide(bullet);
      bullet.setActive(false).setVisible(false);
      bullet.setVelocity?.(0, 0);
      this.player.takeDamage(1);
    };
    this.physics.add.overlap(this.player, this.enemyBullets, onEnemyBulletHitsPlayer, undefined, this);

    const onPlayerHitsEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_pObj, eObj) => {
      const enemy = eObj as unknown as Enemy;
      this.player.takeDamage(1);
      this.enemies.killAndHide(enemy);
      enemy.setActive(false).setVisible(false);
      enemy.setVelocity?.(0, 0);
    };
    this.physics.add.overlap(this.player, this.enemies, onPlayerHitsEnemy, undefined, this);
  }

  // --- Enemy loader (unchanged semantics) ---
  private async loadEnemyFormationsFromIndex(): Promise<void> {
    try {
      const res = await fetch("/formations/index.json");
      const json = await res.json();
      this.formationFiles = json.files ?? [];
      if (!this.formationFiles.length) return;
      this.currentFormationIndex = 0;
      this.time.addEvent({
        delay: 10000,
        loop: true,
        callback: () => {
          if (this.currentFormationIndex < this.formationFiles.length) {
            const nextFile = this.formationFiles[this.currentFormationIndex];
            console.log(`[PlayScene] Enemy formation: ${nextFile}`);
            this.formationManager.loadAndScheduleFromFile(nextFile);
            this.currentFormationIndex++;
          }
        },
      });
    } catch (err) {
      console.error("[PlayScene] Failed to load enemy formations", err);
    }
  }

  // --- Ally loader (always insects.json) ---
  private async loadAllyFormations(): Promise<void> {
    try {
      const res = await fetch("/formations/insects.json");
      const json = await res.json();
      // normalized formations array
      this.allyFormations = json.formations ?? [];
      if (!this.allyFormations.length) {
        console.warn("[PlayScene] No ally formations in insects.json");
        return;
      }
      this.allyFormationIndex = 0;
      console.log("[PlayScene] Ally formations loaded:", this.allyFormations.map((f: any) => f.id));
    } catch (err) {
      console.error("[PlayScene] Failed to load ally formations", err);
    }
  }

  // --------------------
  // Resize handler
  // --------------------
  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    // resize the tile background to fill new size
    if (this.bg) {
      this.bg.setSize(width, height);
    }

    // reposition HUD
    if (this.scoreText) {
      this.scoreText.setPosition(12, 12);
    }

    // reposition player (keep relative)
    if (this.player) {
      this.player.setPosition(width * 0.5, height * 0.8);
    }

    // tell AllyManager to recompute offsets after the new size
    // (AllyManager should implement recomputeOffsets(width,height))
    if ((this.allyManager as any)?.recomputeOffsets instanceof Function) {
      (this.allyManager as any).recomputeOffsets(width, height);
    }
  }
}
