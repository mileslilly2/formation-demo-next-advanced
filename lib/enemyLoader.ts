export async function loadEnemyFormation(filename:string) {
  const res = await fetch('/formations/'+filename);
  return res.ok ? res.json() : null;
}
