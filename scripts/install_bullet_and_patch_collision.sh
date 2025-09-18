#!/usr/bin/env bash
# save as scripts/install_bullet_and_patch_collision.sh
set -e
OUT_BULLET="phaser/entities/Bullet.ts"
PLAY="phaser/scenes/PlayScene.ts"
BACKUP_PLAY="${PLAY}.bak.$(date +%s)"

mkdir -p phaser/entities

cat > "$OUT_BULLET" <<'TS'
import * as Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number = 1;
  owner: 'player' | 'enemy' | string = 'player';

  constructor(scene: Phaser.Scene, x = 0, y = 0, texture = 'bullet') {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).enable = false;
    }
  }

  init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    texture = 'bullet',
    owner: 'player' | 'enemy' | string = 'player',
    damage = 1
  ) {
    this.setTexture(texture);
    this.setPosition(x, y);
    this.setDisplaySize(12, 18);
    this.owner = owner;
    this.damage = damage;

    if (this.body && (this.body as Phaser.Physics.Arcade.Body).reset) {
      (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
      (this.body as Phaser.Physics.Arcade.Body).enable = true;
    }

    this.setActive(true);
    this.setVisible(true);
    this.setVelocity(vx, vy);
  }

  kill() {
    if (this.body && (this.body as Phaser.Physics.Arcade.Body).enable) {
      try {
        this.disableBody(true, true);
      } catch {
        this.setActive(false);
        this.setVisible(false);
        (this.body as any).stop && (this.body as any).stop();
        (this.body as any).enable = false;
      }
    } else {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
TS

echo "Wrote $OUT_BULLET"

# attempt to patch PlayScene collision block
if [ -f "$PLAY" ]; then
  cp "$PLAY" "$BACKUP_PLAY"
  echo "Backed up original PlayScene to $BACKUP_PLAY"

  # build replacement block
  read -r -d '' REPL <<'BLOCK' || true
this.physics.add.overlap(this.bullets, this.enemies, (bObj, eObj) => {
  const b = bObj as Bullet;
  const e = eObj as Enemy;
  if (!b || !e) return;
  console.debug('[COLLISION] bullet->enemy', { owner: (b as any).owner, damage: (b as any).damage, bActive: b.active, eActive: e.active });
  if (!b.active || !e.active) return;
  if ((b as any).owner === 'enemy') return;
  b.kill ? b.kill() : b.disableBody(true, true);
  const dmg = (b as any).damage ?? 1;
  const killed = typeof e.receiveDamage === 'function' ? e.receiveDamage(dmg) : false;
  if (killed && this.explosionEmitter) this.explosionEmitter.explode(10, e.x, e.y);
});
BLOCK

  # Use awk to replace the first matching overlap block
  awk -v repl="$REPL" '
    BEGIN{found=0}
    {
      if(!found && match($0, /this\.physics\.add\.overlap\(\s*this\.bullets,\s*this\.enemies/)) {
        # print the replacement and switch to skipping mode
        print repl;
        found=1;
        skipping=1;
        next;
      }
      if(found && skipping) {
        # look for a line that closes the block: a line that contains "});"
        if($0 ~ /^\s*\}\);\s*$/) { skipping=0; next; }
        else next;
      }
      print $0;
    }
  ' "$PLAY" > "${PLAY}.tmp" && mv "${PLAY}.tmp" "$PLAY"

  if grep -q "bullet->enemy" "$PLAY"; then
    echo "PlayScene patched successfully (first overlap block replaced)."
  else
    echo "Patch attempt completed but replacement marker not found in PlayScene; please paste the collision snippet manually."
  fi
else
  echo "PlayScene file not found at $PLAY. Bullet file created. Manually add the collision snippet to your PlayScene."
fi

echo "Done."
