import { platformGames } from "../../lib/platformGames";

export const WORLD_ACCENTS = [0x9edfe6, 0x75b9e9, 0xb7ce9d, 0xd5a57a] as const;
export const ALL_WORLD_INDICES = platformGames.map((_, index) => index);
export const ORBIT_CARD_WIDTH = 3.65;
/** Closest equivalent turn keeps previous/next and wrap-around reversible. */
export function nearestOrbitTurn(current: number, selected: number, count: number) {
  const turn = selected * Math.PI * 2 / Math.max(1, count);
  return turn + Math.round((current - turn) / (Math.PI * 2)) * Math.PI * 2;
}

export function orbitCardPose(slot: number, count: number, turn: number) {
  const raw = slot * Math.PI * 2 / Math.max(1, count) - turn;
  const angle = Math.atan2(Math.sin(raw), Math.cos(raw));
  return { x: Math.sin(angle) * 3.65, y: 0.8 - Math.sin(angle) * 1.15, z: Math.cos(angle) * 3.6, rotation: -Math.sin(angle) * 0.9, roll: -Math.sin(angle) * 0.075 };
}

export function nextWorldIndex(current: number, direction: number, visible = ALL_WORLD_INDICES) {
  const slot = Math.max(0, visible.indexOf(current));
  return visible[(slot + direction + visible.length) % visible.length] ?? 0;
}

export function spatialProgress(scrollY: number, top: number, height: number, viewportHeight: number) {
  return Math.max(0, Math.min(1, (scrollY - top) / Math.max(1, height - viewportHeight)));
}

export function isSpatialGameLaunch(href: string, origin: string) {
  const url = new URL(href, origin);
  return url.origin === origin && platformGames.some(game => new URL(game.href, origin).pathname === url.pathname);
}
