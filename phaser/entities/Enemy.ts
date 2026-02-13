// phaser/entities/Enemy.ts
import Phaser from "phaser";
import Bullet from "./Bullet";

export default class Enemy extends Phaser.Physics.Arcade.Image {
  hp: number = 1;
  type: string = "scout";
  fireTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture?: string, frame?: string | number) {
    super(scene, x, y, texture as any, frame as any);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  /** Initialize enemy properties when spawned */
  init(
    idx: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    hp: number,
    type: string = "scout"
  ) {
    this.setPosition(x, y);
    this.setVelocity(vx, vy);
    this.initDisplay(size);
    this.hp = hp;
    this.type = type;
  }

  /** Display setup (size + collision circle) */
  initDisplay(size = 48) {
    this.setDisplaySize(size, size);
    this.setCircle(Math.min(this.width, this.height) * 0.4);
  }

  /** Handle taking damage */
  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  /** Start enemy auto-firing loop */
  startFiring(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group) {
    this.fireTimer?.remove(false); // stop old timer

    const profile = this.getShootingProfile();

    this.fireTimer = scene.time.addEvent({
      delay: profile.rate,
      loop: true,
      callback: () => this.fire(group, profile),
    });
  }

  /** Fire pattern logic */
  private fire(group: Phaser.Physics.Arcade.Group, profile: { pattern: string; speed: number }) {
    if (!this.active) return;

    switch (profile.pattern) {
      case "straight":
        this.spawnBullet(group, 0, profile.speed);
        break;
      case "spread":
        [-0.2, 0, 0.2].forEach(offset => this.spawnBullet(group, offset, profile.speed));
        break;
      case "burst":
        for (let i = -2; i <= 2; i++) {
          this.spawnBullet(group, i * 0.15, profile.speed);
        }
        break;
      case "random":
        if (Math.random() < 0.5) this.spawnBullet(group, 0, profile.speed);
        break;
    }
  }

  /** Spawn a Bullet instance from the pool */
  private spawnBullet(group: Phaser.Physics.Arcade.Group, angleOffset: number, speed: number) {
    const bullet = group.get(this.x, this.y, "bullet") as Bullet;
    if (!bullet) return;

    // compute velocity based on angle
    const angle = Phaser.Math.DegToRad(90) + angleOffset; // downward
    const velocity = new Phaser.Math.Vector2();
    this.scene.physics.velocityFromRotation(angle, speed, velocity);

    // use Bullet.init for consistency
    bullet.init(this.x, this.y, velocity.x, velocity.y, "bullet", "enemy", 1);
  }

  /** Shooting profile per enemy type */
  private getShootingProfile() {
    switch (this.type) {
      case "bruiser":
        return { pattern: "spread", rate: 2000, speed: 120 };
      case "scout":
        return { pattern: "straight", rate: 1500, speed: 180 };
      default:
        return { pattern: "random", rate: 2500, speed: 150 };
    }
  }

  /** Clean up timers */
  destroy(fromScene?: boolean) {
    this.fireTimer?.remove(false);
    super.destroy(fromScene);
  }
}
