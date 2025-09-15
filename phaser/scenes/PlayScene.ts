import Phaser from 'phaser';
import { scheduleFormationFromJson } from '../systems/FormationAdapter';


export class PlayScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private fireCooldown = 0;

  constructor() {
    super('play');
  }

  create() {
    const { width, height } = this.scale;

    // Background tile sprite for scrolling background
    this.bg = this.add.tileSprite(0, 0, width, height, 'bg').setOrigin(0, 0);

    // Player sprite (use an atlas frame if available)
    // fallback to a simple built-in shape if atlas is not available
    this.player = this.physics.add.sprite(width * 0.5, height * 0.8, undefined as any);
    this.player.setDisplaySize(48, 48);
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(18);

    // Bullet group (pooled)
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 300,
      runChildUpdate: false,
    });

    // Enemies group
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: false,
    });

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) =>
      this.onBulletHitsEnemy(b as Phaser.Types.Physics.Arcade.ImageWithDynamicBody, e as Phaser.Types.Physics.Arcade.ImageWithDynamicBody)
    );
    this.physics.add.overlap(this.player, this.enemies, () => this.onPlayerHit());

    // Default spawn wave (simple proof-of-life)
    this.time.addEvent({
      delay: 750,
      repeat: 12,
      callback: () => {
        const x = Phaser.Math.Between(32, width - 32);
        const enemy = this.enemies.get(x, -40, undefined as any) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
        if (!enemy) return;
        enemy.setActive(true).setVisible(true);
        enemy.setDisplaySize(48, 48);
        enemy.setVelocity(0, Phaser.Math.Between(80, 140));
        enemy.setCircle(18);
      },
    });

    // Listen for HUD selections forwarded by React wrapper
    this.game.events.on('formation:selected', this.onFormationSelected, this);

    // Resize: keep bg sized
    this.scale.on('resize', (sz: Phaser.Structs.Size) => {
      this.bg.setSize(sz.width, sz.height);
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    // Scroll background
    this.bg.tilePositionY -= 60 * dt;

    // Movement
    const speed = 280;
    const vx = (this.cursors.left?.isDown ? -1 : 0) + (this.cursors.right?.isDown ? 1 : 0);
    const vy = (this.cursors.up?.isDown ? -1 : 0) + (this.cursors.down?.isDown ? 1 : 0);
    this.player.setVelocity(vx * speed, vy * speed);

    // Firing
    this.fireCooldown -= dt;
    if ((this.cursors.space?.isDown || this.input.activePointer.isDown) && this.fireCooldown <= 0) {
      this.fireCooldown = 0.12;
      this.fireBullet();
    }

    // Cleanup off-screen
    this.bullets.children.iterate((b) => {
      const bb = b as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (bb.active && (bb.y < -32 || bb.y > this.scale.height + 32 || bb.x < -32 || bb.x > this.scale.width + 32)) {
        bb.disableBody(true, true);
      }
      return true;
    });

    this.enemies.children.iterate((e) => {
      const ee = e as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (ee.active && ee.y > this.scale.height + 48) {
        ee.disableBody(true, true);
      }
      return true;
    });
  }

  private fireBullet() {
    const b = this.bullets.get(this.player.x, this.player.y - 20, undefined as any) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.setDisplaySize(12, 18);
    b.setVelocity(0, -520);
    b.setCircle(6);
  }

  private onBulletHitsEnemy(_b: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, e: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    _b.disableBody(true, true);
    e.disableBody(true, true);
    // TODO: add explosion, score increment
  }

  private onPlayerHit() {
    // Simple reset on hit — return to menu
    this.scene.start('menu');
  }

  private async onFormationSelected(filename?: string) {
    if (!filename) return;
    try {
      // Use the FormationAdapter helper to schedule spawns
      await scheduleFormationFromJson(this, filename, this.enemies);
    } catch (err) {
      // ignore errors for now
      // console.warn('formation load failed', err);
    }
  }
}
