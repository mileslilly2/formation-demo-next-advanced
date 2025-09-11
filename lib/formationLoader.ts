export async function loadInsectFormations() {
  const res = await fetch('/formations/insects.json');
  return res.ok ? res.json() : { formations: [] };
}

export function buildFormation(def:any, cw:number, ch:number) {
  return (def.ships||[]).map((s:any)=>({
    x:(s.x_norm/100)*cw,
    y:(s.y_norm/100)*ch,
    baseOffsetX: ((s.x_norm??50)-50)/100*cw*0.4,
    baseOffsetY: ((s.y_norm??50)-50)/100*ch*0.4,
    behavior: def.behavior||'static'
  }));
}
