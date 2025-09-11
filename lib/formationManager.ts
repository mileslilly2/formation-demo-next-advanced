import { PlayerShip } from './types';

export function updateFormation(
  playerFormation: PlayerShip[],
  player: { x: number; y: number },
  trailHistory: { x: number; y: number }[],
  now: number
) {
  if (playerFormation.length === 0) return;
  for (let i = 0; i < playerFormation.length; i++) {
    const ship = playerFormation[i];
    if (ship.behavior === 'trail') {
      const delay = (i + 1) * 10;
      if (trailHistory[delay]) {
        ship.x = trailHistory[delay].x;
        ship.y = trailHistory[delay].y;
      } else {
        ship.x = player.x; ship.y = player.y;
      }
    } else if (ship.behavior === 'static' || ship.behavior === 'line') {
      ship.x = player.x + (ship.baseOffsetX ?? 0);
      ship.y = player.y + (ship.baseOffsetY ?? 0);
    } else if (ship.behavior === 'orbit') {
      const t = now / 1000;
      ship.x = player.x + (ship.baseOffsetX ?? 0) + Math.cos(t + (ship.baseOffsetX ?? 0)) * 20;
      ship.y = player.y + (ship.baseOffsetY ?? 0) + Math.sin(t + (ship.baseOffsetY ?? 0)) * 20;
    }
  }
}
