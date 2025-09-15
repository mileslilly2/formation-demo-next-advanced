/**
 * Small helper to translate legacy manager outputs / function calls
 * into a formation JSON structure usable by scheduleFormationFromJson.
 *
 * Example usage:
 *   const formation = legacyToFormation(legacyObjectFromLib);
 *   save formation.json and then load through scheduleFormationFromJson
 */

export function legacyToFormation(legacy: any) {
  // This is intentionally permissive: adapt to your legacy shape.
  // Example: old enemyManager might expose array of {delay, x, speed}
  const spawns = [];

  if (Array.isArray(legacy?.waves)) {
    for (const wave of legacy.waves) {
      // wave might have pattern with offsets
      if (Array.isArray(wave.enemies)) {
        for (const e of wave.enemies) {
          spawns.push({
            t: e.delay ?? wave.delay ?? 0,
            x: e.x ?? wave.x ?? null,
            vy: e.speed ?? wave.speed ?? 120,
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
        size: s.size ?? 48,
      });
    }
  }

  return { spawns };
}
