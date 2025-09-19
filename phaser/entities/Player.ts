// phaser/entities/Player.ts
import * as Phaser from "phaser";
import Bullet from "./Bullet";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private maxHp: number;
  private hp: number;
  private isInvulnerable = false;
  private invulTween?: Phaser.Tweens.Tween;
  private invulTimer?: Phaser.Time.TimerEvent;
  private hpBarGraphics!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(48, 48);
    this.setCollideWorldBounds(true);
    this.setCircle(18);

    // HP
    this.maxHp = 10;
    this.hp = this.maxHp;

    // HUD
    this.hpBarGraphics = scene.add.graphics().setDepth(1000);
    this.hpText = scene.add
      .text(12, 36, "", { color: "#fff", fontSize: "14px" })
      .setDepth(1000);
    this.updateHpHud();
  }

  public fire(bulletGroup: Phaser.Physics.Arcade.Group) {
    const b = bulletGroup.get(this.x, this.y - 20) as Bullet; // no texture key here
    if (!b) return;
    b.init(this.x, this.y - 20, 0, -400, "bullet", "player");
  }

  public takeDamage(amount: number) {
    if (this.isInvulnerable) return;

    this.hp = Math.max(0, this.hp - Math.max(1, Math.floor(amount)));
    this.updateHpHud();

    this.setInvulnerable(1000);

    if (this.hp <= 0) {
      this.die();
    }
  }

  private setInvulnerable(ms: number) {
    if (this.invulTimer) this.invulTimer.remove(false);
    if (this.invulTween) this.invulTween.stop();

    this.isInvulnerable = true;

    this.invulTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.25, to: 1 },
      duration: 150,
      yoyo: true,
      repeat: Math.floor(ms / 150 / 2),
    });

    this.invulTimer = this.scene.time.addEvent({
      delay: ms,
      callback: () => {
        this.isInvulnerable = false;
        this.setAlpha(1);
      },
    });
  }

  private updateHpHud() {
    const x = 12,
      y = 56;
    const w = 180,
      h = 12;
    const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.hpBarGraphics.clear();

    this.hpBarGraphics.fillStyle(0x2b2f36, 1);
    this.hpBarGraphics.fillRect(x - 1, y - 1, w + 2, h + 2);

    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(255, 0, 0),
      new Phaser.Display.Color(0, 255, 0),
      100,
      Math.round(pct * 100)
    );
    const colorInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);

    this.hpBarGraphics.fillStyle(colorInt, 1);
    this.hpBarGraphics.fillRect(x, y, Math.max(2, Math.floor(w * pct)), h);

    this.hpText.setText(`HP: ${this.hp} / ${this.maxHp}`);
  }

  private die() {
    const emitter = (this.scene as any).explosionEmitter as Phaser.GameObjects.Particles.ParticleEmitter;
    if (emitter) emitter.explode(24, this.x, this.y);

    this.scene.time.delayedCall(600, () => {
      this.scene.events.emit("game-over"); // let PlayScene handle transition
    });
  }
}
