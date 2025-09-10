export async function loadFormationsIndex(): Promise<string[]> {
  try {
    const r = await fetch('/formations/index.json');
    if (!r.ok) return [];
    const arr = await r.json();
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export async function loadInsects(): Promise<any | null> {
  try {
    const r = await fetch('/formations/insects.json');
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

export async function loadFormationFile(filename: string): Promise<any | null> {
  if (!filename) return null;
  try {
    const r = await fetch('/formations/' + filename);
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}
