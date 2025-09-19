// phaser/scenes/PlayScene.ts
import * as Phaser from "phaser";
import Player from "../entities/Player";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";
import FormationManager from "../systems/FormationManager";
import AllyManager from "../systems/AllyManager";
import { logFlags } from '../../src/flags';

export default class PlayScene extends Phaser.Scene {
  // instance fields
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
  private currentFormationIndex: number = 0; // used by auto scheduler

  // manual index which file the F-key will operate on (separate from auto scheduler)
  private manualFileIndex: number = 0;

  // caching and per-file indices so F cycles *inside* a file
  private formationFileCache: Record<string, any[]> = {};
  private formationIndexByFile: Record<string, number> = {};

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
    logFlags();                      // actually call the flag logger
    console.log(">>> CREATE running");

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
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // --- Single F key (create once) ---
    this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // Make canvas focusable and focus it so key events reach the game reliably
    const canvas = (this.game.canvas as HTMLCanvasElement | null);
    if (canvas) {
      canvas.tabIndex = 0;
      canvas.style.outline = 'none';
      try { canvas.focus(); } catch (e) { /* ignore */ }
    }

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

    // --- HUD (simple score text) ---
    this.scoreText = this.add
      .text(12, 12, "Score: 0", { color: "#fff", fontSize: "16px" })
      .setDepth(1000);

    // --- Collisions ---
    this.setupCollisions();

    // --- Load formations from index.json ---
    this.loadEnemyFormationsFromIndex();
    this.loadAllyFormations();

    // attach F listener (event-based). This will operate on manualFileIndex and
    // will advance the formation index inside that file (not the auto scheduler index).
    this.input.keyboard.on('keydown-F', () => {
  if (!this.allyFormations.length) return;

    this.allyFormationIndex =
      (this.allyFormationIndex + 1) % this.allyFormations.length;

    const formation = this.allyFormations[this.allyFormationIndex];
    console.log(`[PlayScene] Ally cycle → ${formation.id}`);

    this.allyManager.applyFormation(formation);
  });

  }

  update(_time: number, delta: number) {
    if (!this.player) return;

    // Background scroll
    this.bg.tilePositionY -= delta * 0.06;

    // Player movement + shooting
    this.handlePlayerControls();

    // handleFormationCycle no longer checks JustDown; ally update handled here or in helper
    // (keep a small helper to update allies every frame)
    this.handleFormationCycle();

    // update ally positions every frame (single place)
    this.allyManager.update();
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
  private async loadEnemyFormationsFromIndex(): Promise<void> {
  try {
    const res = await fetch("/formations/index.json");
    const json = await res.json();
    this.formationFiles = json.files ?? [];

    if (!this.formationFiles.length) return;

    this.currentFormationIndex = 0;

    // auto-schedule enemy waves
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
private allyFormations: any[] = [];
private allyFormationIndex: number = 0;

private async loadAllyFormations(): Promise<void> {
  try {
    const res = await fetch("/formations/insects.json");
    const json = await res.json();
    this.allyFormations = json.formations ?? [];

    if (!this.allyFormations.length) {
      console.warn("[PlayScene] No ally formations in insects.json");
      return;
    }

    this.allyFormationIndex = 0;
    console.log("[PlayScene] Ally formations loaded:", this.allyFormations.map(f => f.id));
  } catch (err) {
    console.error("[PlayScene] Failed to load ally formations", err);
  }
}



  // --------------------
  // Formation helpers
  // --------------------

  // Previously this checked JustDown; now it simply ensures allyManager exists.
  // F presses are handled by keydown-F event listener in create().
  private handleFormationCycle() {
    // Keep this method in case you want to add time-based cycling logic
    if (!this.allyManager) return;
    // No JustDown here; event listener drives manual cycling.
  }

  // load file (cached) and apply the next formation inside it
  private async loadAndApplyNextFormationInFile(filename: string) {
    try {
      const formations = await this.loadFormationsFromFileCached(filename);
      if (!formations.length) {
        console.warn(`[PlayScene] no formations in ${filename}`);
        return;
      }

      const prevIndex = this.formationIndexByFile[filename] ?? -1;
      const nextIndex = (prevIndex + 1) % formations.length;
      this.formationIndexByFile[filename] = nextIndex;

      const formation = formations[nextIndex];
      if (!formation || !Array.isArray(formation.ships)) {
        console.error('[PlayScene] formation malformed', formation);
        return;
      }

      // apply — AllyManager will clear previous allies
      this.allyManager.applyFormation(formation);
      console.log(`[PlayScene] Applied formation id=${formation.id ?? '<no-id>'} index=${nextIndex} from ${filename}`);
    } catch (err) {
      console.error('[PlayScene] Failed to load/apply formation', err);
    }
  }

  // Fetch + normalize + cache formations[] from a file
  private async loadFormationsFromFileCached(filename: string): Promise<any[]> {
    if (this.formationFileCache[filename]) return this.formationFileCache[filename];

    try {
      console.log(`[PlayScene] fetching formations file: ${filename}`);
      const res = await fetch(`/formations/${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log('[PlayScene] raw file JSON:', json);

      let formations: any[] = [];
      if (Array.isArray(json)) {
        formations = json;
      } else if (json && Array.isArray(json.formations)) {
        formations = json.formations;
      } else if (json && json.ships) {
        formations = [json];
      } else {
        throw new Error('No formations[] found in file');
      }

      this.formationFileCache[filename] = formations;
      if (this.formationIndexByFile[filename] === undefined) {
        this.formationIndexByFile[filename] = -1;
      }

      console.log(`[PlayScene] loaded ${formations.length} formations from ${filename}`);
      return formations;
    } catch (err) {
      console.error(`[PlayScene] failed to load formations file ${filename}`, err);
      return [];
    }
  }
}
