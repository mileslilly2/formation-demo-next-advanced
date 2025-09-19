// phaser/scenes/PlayScene.ts
import * as Phaser from "phaser";
import Player from "../entities/Player";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";

import InputManager from "../systems/InputManager";
import FormationManager from "../systems/FormationManager";
import CollisionManager from "../systems/CollisionManager";

export default class PlayScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Player;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;

  private inputManager!: InputManager;
  private formationManager!: FormationManager;
  private collisionManager!: CollisionManager;

  constructor() {
    super("play");
  }

  create() {
    const { width, height } = this.scale;

    // --- Background ---
    this.bg = this.add
      .tileSprite(0, 0, width, height, "bg")
      .setOrigin(0, 0)
      .setDepth(0);

    // --- Bullet Pools ---
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: 200,
    });

    this.enemyBullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: 200,
    });

    // --- Enemies ---
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
      maxSize: 50,
    });

    // --- Player ---
    this.player = new Player(this, width * 0.5, height * 0.8);

    // --- Systems ---
    this.inputManager = new InputManager(this, this.player, this.bullets);
    this.formationManager = new FormationManager(
      this,
      this.enemies,
      this.enemyBullets
    );
    this.collisionManager = new CollisionManager(this);

    // Setup collisions AFTER groups exist
    this.collisionManager.setupCollisions(
      this.player,
      this.bullets,
      this.enemies,
      this.enemyBullets
    );

    // --- Load first wave ---
    this.formationManager.loadAndScheduleFromFile("test_spawn.json");

    // --- Game Over handler ---
    this.events.once("game-over", () => {
      console.log("[PlayScene] Game Over!");
      this.scene.start("level-select");
    });
  }

  update(_time: number, delta: number) {
    // Scroll background
    this.bg.tilePositionY -= delta * 0.06;

    // Input
    this.inputManager.update(delta);
  }
}
