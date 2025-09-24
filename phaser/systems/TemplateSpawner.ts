import * as Phaser from "phaser";
import Enemy from "../entities/Enemy";

export default class TemplateSpawner {
  constructor(
    private scene: Phaser.Scene,
    private enemies: Phaser.Physics.Arcade.Group,
  ) {}

  spawnFromTemplates(templates: Record<string, any>, opts?: {x?:number;y?:number}) {
    const { x = this.scene.scale.width * 0.8, y = this.scene.scale.height * 0.3 } = opts || {};
    const spawn = (spec: any) => {
      const e = new Enemy(this.scene, x, y, "enemy");
      e.setData("hp", spec.hp ?? 10);
      e.setVelocityX(-(spec.speed ?? 80));
      this.enemies.add(e);
    };
    if (templates.stinger) spawn(templates.stinger);
    if (templates.drone)   spawn(templates.drone);
    if (templates.boss)    spawn({...templates.boss, hp: Math.max(150, templates.boss.hp ?? 150), speed: templates.boss.speed ?? 40});
  }
}
