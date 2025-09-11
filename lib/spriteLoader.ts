export async function loadSprite() {
  const metaRes = await fetch('/sprites/insect_shapes_sheet.json');
  if (!metaRes.ok) return {img:null, meta:null};
  const meta = await metaRes.json();
  return new Promise<{img:HTMLImageElement, meta:any}>((resolve) => {
    const img = new Image();
    img.src = meta.image || '/sprites/insect_shapes_sheet.png';
    img.onload = () => resolve({img, meta});
  });
}
