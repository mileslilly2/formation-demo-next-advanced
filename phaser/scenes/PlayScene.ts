import * as Phaser from 'phaser';

export class PlayScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('play');
  }

  create() {
    const { width, height } = this.scale;

    // background color
    this.add.rectangle(0, 0, width, height, 0x061025).setOrigin(0);

    // simple player placeholder
    this.player = this.physics.add.sprite(width / 2, height - 60, undefined as any);
    this.player.setDisplaySize(40, 40);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(0x00ff00);

    this.cursors = this.input.keyboard.createCursorKeys();

    // instruction text
    this.add.text(width / 2, 40, 'Arrow keys to move, ESC to menu', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  update() {
    const speed = 200;
    const vx = (this.cursors.left?.isDown ? -1 : 0) + (this.cursors.right?.isDown ? 1 : 0);
    const vy = (this.cursors.up?.isDown ? -1 : 0) + (this.cursors.down?.isDown ? 1 : 0);
    this.player.setVelocity(vx * speed, vy * speed);

    if (this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC), 250)) {
      this.scene.start('menu');
    }
  }
}
