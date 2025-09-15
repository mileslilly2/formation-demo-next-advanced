import Phaser from 'phaser';

/**
 * Minimal adapter: fetches a formation JSON from /formations/<filename>
 * expected format:
 * {
 *   "spawns": [
 *     {"t": 0, "x": 120, "vy": 120},
 *     {"t": 500, "x": 180, "vy": 140}
 *   ]
 * }
 *
 * It schedules spawn events on the provided scene and uses the provided group to create enemies.
 */
export async function scheduleFormationFromJson(
  scene: Phaser.Scene,
  filename: string,
  enemiesGroup: Phaser.Physics.Arcade.Group
) {
  const url = `/formations/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`formation fetch failed: ${res.status}`);
  const json = await res.json();

  // clear previous timers (we assume formation replaces current timetable)
  scene.time.removeAllEvents();

  if (!Array.isArray(json?.spawns)) return;

  for (const spawn of json.spawns) {
    const delay = Math.max(0, spawn.t ?? 0);
    scene.time.addEvent({
      delay,
      callback: () => {
        const x = spawn.x ?? Phaser.Math.Between(32, scene.scale.width - 32);
        const enemy = enemiesGroup.get(x, -40, undefined as any) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
        if (!enemy) return;
        enemy.setActive(true).setVisible(true);
        if (spawn.size) enemy.setDisplaySize(spawn.size, spawn.size);
        else enemy.setDisplaySize(48, 48);
        const vy = spawn.vy ?? 120;
        enemy.setVelocity(spawn.vx ?? 0, vy);
        enemy.setCircle(Math.min(enemy.width, enemy.height) * 0.4);
      },
    });
  }
}
