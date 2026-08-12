export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function inverseLerp(min: number, max: number, value: number) {
  if (max <= min) return value >= max ? 1 : 0;
  return clamp((value - min) / (max - min));
}

export function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function smootherstep(value: number) {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function damp(current: number, target: number, lambda: number, deltaSeconds: number) {
  const alpha = 1 - Math.exp(-lambda * Math.max(0, deltaSeconds));
  return current + (target - current) * alpha;
}

export function lerp(min: number, max: number, amount: number) {
  return min + (max - min) * clamp(amount);
}

export function createSeededRandom(seed = 0x51bc2026) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
