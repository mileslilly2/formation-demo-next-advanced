import Phaser from 'phaser';

/**
 * Robust debug-friendly adapter.
 * - tolerant parsing: accepts {spawns: [...]}, top-level array, or enemy_spawns field
 * - logs loads + scheduled spawn callbacks
 */
export async function scheduleFormationFromJson(
  scene: Phaser.Scene,
  filename: string,
  spawnCallback: (spec: { x:number; y:number; vx?:number; vy?:number; size?:number; hp?:number }) => void
): Promise<void> {
  try {
    console.log('[FormationAdapter] load start:', filename);
    const url = '/formations/' + filename;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[FormationAdapter] fetch failed', url, res.status);
      throw new Error('formation fetch failed: ' + res.status);
    }
    const json = await res.json();
    console.log('[FormationAdapter] fetched JSON:', filename, json);

    // tolerate different shapes
    let spawns: any[] | undefined = undefined;
    if (Array.isArray(json)) spawns = json;
    else if (Array.isArray(json.spawns)) spawns = json.spawns;
    else if (Array.isArray(json.enemy_spawns)) spawns = json.enemy_spawns;
    else if (Array.isArray(json.wave)) spawns = json.wave;

    if (!Array.isArray(spawns)) {
      console.warn('[FormationAdapter] no spawns array found in', filename);
      return;
    }

    // Clear previous timers (we assume formation replaces current timetable)
    scene.time.removeAllEvents();

    for (const spawn of spawns) {
      // Accept t in ms; fallback to 0
      const delay = Math.max(0, spawn.t ?? spawn.delay ?? 0);
      scene.time.addEvent({
        delay,
        callback: () => {
          const x = (typeof spawn.x === 'number') ? spawn.x : Phaser.Math.Between(32, scene.scale.width - 32);
          const spec = {
            x,
            y: spawn.y ?? -40,
            vx: spawn.vx ?? 0,
            vy: spawn.vy ?? (spawn.vy ?? 120),
            size: spawn.size ?? 48,
            hp: spawn.hp ?? 1,
          };
          console.log('[FormationAdapter] spawn firing (file=' + filename + '):', spec, 'orig:', spawn);
          try { spawnCallback(spec); } catch (err) {
            console.error('[FormationAdapter] spawnCallback threw', err);
          }
        },
      });
    }

    console.log('[FormationAdapter] scheduled', spawns.length, 'spawns for', filename);
  } catch (err) {
    console.error('[FormationAdapter] error loading', filename, err);
    throw err;
  }
}
