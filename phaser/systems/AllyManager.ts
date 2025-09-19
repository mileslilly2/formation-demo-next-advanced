// phaser/systems/AllyManager.ts
import * as Phaser from 'phaser';
import Player from '../entities/Player';

type AllyEntry = {
  sprite: Phaser.Physics.Arcade.Sprite;
  offset: Phaser.Math.Vector2;
  behavior: string;
};

export default class AllyManager {
  private scene: Phaser.Scene;
  private player: Player;
  private allies: AllyEntry[] = [];

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
  }

  applyFormation(formation: any) {
    this.allies.forEach((a) => a.sprite.destroy());
    this.allies = [];

    formation.ships.forEach((ship: any) => {
      const ally = this.scene.physics.add.sprite(this.player.x, this.player.y, 'player');
      ally.setDisplaySize(32, 32).setTint(0x00ffcc);
      this.allies.push({
        sprite: ally,
        offset: new Phaser.Math.Vector2(
        (ship.x_norm - 50) / 100 * this.scene.scale.width,
        (ship.y_norm - 50) / 100 * this.scene.scale.height
      ),

        behavior: formation.behavior ?? 'follow',
      });
    });
  }

  update() {
    this.allies.forEach((entry) => {
      entry.sprite.x = this.player.x + entry.offset.x;
      entry.sprite.y = this.player.y + entry.offset.y;
    });
  }
}
