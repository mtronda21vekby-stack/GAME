import type { CameraKeyframe } from "../../experience/camera/CameraKeyframes";
import { platformGames } from "../../lib/platformGames";

export const DESKTOP_SPATIAL_CAMERA: readonly CameraKeyframe[] = [
  { progress: 0, position: [0.2, 0.8, 10.4], target: [1, 0.2, 0], fov: 38 },
  { progress: 0.45, position: [0, 0.6, 12.7], target: [0, 0.5, 0.7], fov: 40 },
  { progress: 0.72, position: [0, 0.6, 12.7], target: [0, 0.5, 0.7], fov: 40 },
  { progress: 1, position: [0.5, 0.6, 11.8], target: [0.8, 0.3, 0], fov: 40 },
];

export const MOBILE_SPATIAL_CAMERA: readonly CameraKeyframe[] = [
  { progress: 0, position: [1.3, 2.3, 17.2], target: [1.3, 3.7, 0], fov: 36 },
  { progress: 0.45, position: [0, 2, 20.6], target: [0, 1.75, 0.6], fov: 36 },
  { progress: 0.72, position: [0, 2, 20.6], target: [0, 1.75, 0.6], fov: 36 },
  { progress: 1, position: [0, 0.8, 20], target: [0, 1.2, 0], fov: 38 },
];

export const WORLD_ACCENTS = [0x9edfe6, 0x75b9e9, 0xb7ce9d, 0xd5a57a] as const;
export const ALL_WORLD_INDICES = platformGames.map((_, index) => index);
export const ORBIT_CARD_WIDTH = 4.4;
export const ORBIT_CARD_HEIGHT = ORBIT_CARD_WIDTH * 9 / 16;

export function orbitCoverSize(aspect: number) {
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  return { width: Math.min(ORBIT_CARD_WIDTH, ORBIT_CARD_HEIGHT * ratio), height: Math.min(ORBIT_CARD_HEIGHT, ORBIT_CARD_WIDTH / ratio) };
}

/** Closest equivalent turn keeps previous/next and wrap-around reversible. */
export function nearestOrbitTurn(current: number, selected: number, count: number) {
  const turn = selected * Math.PI * 2 / Math.max(1, count);
  return turn + Math.round((current - turn) / (Math.PI * 2)) * Math.PI * 2;
}

export function orbitCardPose(slot: number, count: number, turn: number) {
  const raw = slot * Math.PI * 2 / Math.max(1, count) - turn;
  const angle = Math.atan2(Math.sin(raw), Math.cos(raw));
  return { x: Math.sin(angle) * 4.7, y: 0.8 + Math.sin(angle * 2) * 0.25, z: Math.cos(angle) * 3.6, rotation: -Math.sin(angle) * 0.55 };
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
