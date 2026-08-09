import { clamp, damp } from "../core/math";
import type { ScrollDirection } from "../types";

export const DIRECTION_DEAD_ZONE = 0.0025;

export function smoothScrollProgress(current: number, target: number, deltaSeconds: number, reducedMotion = false) {
  if (reducedMotion) return clamp(target);
  return clamp(damp(current, target, 10.5, deltaSeconds));
}

export function normalizeScrollVelocity(previous: number, current: number, deltaSeconds: number) {
  if (deltaSeconds <= 0) return 0;
  return clamp((current - previous) / deltaSeconds, -1, 1);
}

export function getScrollDirection(velocity: number): ScrollDirection {
  if (Math.abs(velocity) <= DIRECTION_DEAD_ZONE) return 0;
  return velocity > 0 ? 1 : -1;
}
