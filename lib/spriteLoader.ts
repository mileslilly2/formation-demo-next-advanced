export async function loadSpriteMeta(metaUrl: string, imgUrl: string): Promise<{meta:any, img:HTMLImageElement} | null> {
  try {
    const r = await fetch(metaUrl);
    if (!r.ok) return null;
    const meta = await r.json();
    return await new Promise(resolve => {
      const img = new Image();
      img.src = imgUrl;
      img.onload = () => resolve({ meta, img });
      img.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
