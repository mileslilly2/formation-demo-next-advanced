// phaser/systems/HealthManager.ts
import * as Phaser from 'phaser';
import Player from '../entities/Player';

export default class HealthManager {
  private scene: Phaser.Scene;
  private player: Player;
  private hp: number;
  private maxHp: number;

  constructor(scene: Phaser.Scene, player: Player, maxHp = 10) {
    this.scene = scene;
    this.player = player;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  damage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    console.log(`[Health] Player HP: ${this.hp}/${this.maxHp}`);
    if (this.hp <= 0) {
      this.scene.scene.start('menu');
    }
  }

  getHp() {
    return this.hp;
  }
}
