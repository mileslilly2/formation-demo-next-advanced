/**
 * Convert old/legacy manager objects into a simple formation schema:
 * { spawns: [ { t, x, vy, vx, size }, ... ] }
 *
 * Use this to export legacy wave definitions into JSON you can place under /public/formations.
 */
export function legacyToFormation(legacy: any) {
  const spawns: any[] = [];

  if (!legacy) return { spawns };

  if (Array.isArray(legacy?.waves)) {
    for (const wave of legacy.waves) {
      if (Array.isArray(wave.enemies)) {
        for (const e of wave.enemies) {
          spawns.push({
            t: e.delay ?? wave.delay ?? 0,
            x: e.x ?? wave.x ?? null,
            vy: e.speed ?? wave.speed ?? 120,
            vx: e.vx ?? 0,
            size: e.size ?? wave.size ?? 48,
          });
        }
      }
    }
  } else if (Array.isArray(legacy?.spawns)) {
    for (const s of legacy.spawns) {
      spawns.push({
        t: s.t ?? s.delay ?? 0,
        x: s.x ?? null,
        vy: s.vy ?? s.speed ?? 120,
        vx: s.vx ?? 0,
        size: s.size ?? 48,
      });
    }
  }

  return { spawns };
}
