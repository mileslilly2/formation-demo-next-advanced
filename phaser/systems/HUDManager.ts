// phaser/systems/HUDManager.ts
import * as Phaser from 'phaser';

export default class HUDManager {
  private scene: Phaser.Scene;
  private hpText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.hpText = this.scene.add.text(12, 12, 'HP: 10', { color: '#fff', fontSize: '16px' }).setDepth(1000);
  }

  updateHp(hp: number, maxHp: number) {
    this.hpText.setText(`HP: ${hp}/${maxHp}`);
  }

  update(_delta: number) {
    // add more HUD updates later
  }
}
