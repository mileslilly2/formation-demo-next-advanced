# Formation Demo Pro (Next.js + Canvas)

Adds **path types** and a **BulletML-friendly** schema to the simple formation demo:
- `path.type: "line" | "sine" | "bezier" | "bulletml"`
- Sine supports `axis`, `amplitude_norm`, `frequency_hz`, `phase`
- Bezier supports `duration_ms` and `points_norm` (array of 4 control points)
- BulletML path uses `angle_deg` and `speed_px_s`

## Quick start
```bash
npm i
npm run dev
# http://localhost:3000
```

## Deploy to Vercel
- Push to GitHub, import in Vercel (framework: Next.js), deploy with defaults

## Formation JSON (extended)
```json
{
  "formation_id": "sine_test",
  "meta": {"source":"synthetic"},
  "spawn": [{
    "t_ms": 0,
    "type": "scout",
    "x_norm": 50, "y_norm": 0,
    "vx_px_s": 0, "vy_px_s": 80, "hp": 1,
    "path": { "type": "sine", "axis": "x", "amplitude_norm": 12, "frequency_hz": 0.6, "phase": 0 }
  }]
}
```

### Bezier
```json
"path": {
  "type": "bezier",
  "duration_ms": 5000,
  "points_norm": [{"x":10,"y":10},{"x":30,"y":30},{"x":60,"y":10},{"x":80,"y":40}]
}
```

### BulletML (basic)
```json
"path": { "type": "bulletml", "angle_deg": 90, "speed_px_s": 110 }
```

## Files
- `public/formations/*.json` – samples: `sine_test`, `bezier_test`, `bulletml_imported`, plus earlier rich sets
- `public/formations/index.json` – list of formation files displayed in the UI
- `app/page.jsx` – renderer + simple game loop with path support



# Formation Demo — Phaser migration

This repo was refactored to use **Phaser (v3)** for the game loop, physics, collisions and scene management.
Below are the quick steps to run locally and the verification checklist.

## Install
```bash
# install new dependency
npm install phaser@^3.90.0
# or
yarn add phaser@^3.90.0
