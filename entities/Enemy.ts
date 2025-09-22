import Phaser from "phaser";

export default class Enemy extends Phaser.Physics.Arcade.Image {
  hp: number = 1;
  type: string = "scout";
  fireTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture?: string, frame?: string | number) {
    super(scene, x, y, texture as any, frame as any);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  // Called by FormationManager
  init(idx: number, x: number, y: number, vx: number, vy: number, size: number, hp: number, type: string = "scout") {
    this.setPosition(x, y);
    this.setVelocity(vx, vy);
    this.initDisplay(size);
    this.hp = hp;
    this.type = type;
  }

  initDisplay(size = 48) {
    this.setDisplaySize(size, size);
    this.setCircle(Math.min(this.width, this.height) * 0.4);
  }

  // Choose fire style based on enemy type
  startFiring(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group) {
    // Stop any previous timer
    this.fireTimer?.remove(false);

    const profile = this.getShootingProfile();

    this.fireTimer = scene.time.addEvent({
      delay: profile.rate,
      loop: true,
      callback: () => this.fire(group, profile),
    });
  }

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

  private spawnBullet(group: Phaser.Physics.Arcade.Group, angleOffset: number, speed: number) {
    const bullet = group.get(this.x, this.y) as Phaser.Physics.Arcade.Image;
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);

    const angle = Phaser.Math.DegToRad(90) + angleOffset; // down + offset
    this.scene.physics.velocityFromRotation(angle, speed, bullet.body.velocity);
  }

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

  destroy(fromScene?: boolean) {
    this.fireTimer?.remove(false);
    super.destroy(fromScene);
  }
}
