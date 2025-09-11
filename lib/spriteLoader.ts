export async function loadSprite() {
  const meta = await fetch('/sprites/insect_shapes_sheet.json').then((r) => r.json());
  const img = new Image();
  img.src = meta.image || '/sprites/insect_shapes_sheet.png';

  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = (err) => rej(err);
  });

  if (!meta.frame_width || !meta.frame_height) {
    throw new Error('sprite meta.json must define frame_width and frame_height');
  }
  // auto-detect total frames if not given
  if (!meta.frames) {
    meta.frames = Math.floor(img.width / meta.frame_width);
  }
  return { img, meta };
}
