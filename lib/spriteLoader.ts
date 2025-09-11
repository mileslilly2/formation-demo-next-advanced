export async function loadSprite() {
  const meta = await fetch('/sprites/insect_shapes_sheet.json').then(r => r.json());
  const img = new Image();
  img.src = meta.image || '/sprites/insect_shapes_sheet.png';

  // auto-detect frames if not in JSON
  await new Promise<void>((res) => { img.onload = () => res(); });

  if (!meta.frames) {
    meta.frames = Math.floor(img.width / meta.frame_width);
  }

  return { img, meta };
}
