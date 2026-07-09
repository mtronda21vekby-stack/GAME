export const EVOFISH_FISH_ORIENTATION_LOCK_ID = "360_BELLY_SAFE_MIRROR_V1" as const;

export type LockedFishOrientation = {
  readonly lockId: typeof EVOFISH_FISH_ORIENTATION_LOCK_ID;
  readonly rotation: number;
  readonly scaleX: 1;
  readonly scaleY: 1 | -1;
  readonly mirrorBelly: boolean;
};

function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function isLeftHalfPlane(angle: number) {
  return Math.cos(angle) < 0;
}

/**
 * LOCKED USER-APPROVED FISH ORIENTATION BEHAVIOR.
 *
 * Required behavior:
 * - fish remains fully steerable through 360 degrees;
 * - fish nose follows the exact movement / aim angle;
 * - when the angle enters the left half-plane, the sprite mirrors on local Y;
 * - this prevents belly-up / eye-down turns while preserving 360-degree steering;
 * - do NOT replace this with upright-only, clamped tilt, mirror-X, bob/wag, or custom pose logic.
 */
export function lockedFishOrientationForAngle(inputAngle: number): LockedFishOrientation {
  const rotation = normalizeAngle(inputAngle || 0);
  const mirrorBelly = isLeftHalfPlane(rotation);
  return {
    lockId: EVOFISH_FISH_ORIENTATION_LOCK_ID,
    rotation,
    scaleX: 1,
    scaleY: mirrorBelly ? -1 : 1,
    mirrorBelly
  };
}

function sameSign(value: number, expected: 1 | -1) {
  return expected === 1 ? value > 0 : value < 0;
}

export function assertFishOrientationLock() {
  const cases: Array<{ angle: number; mirrorBelly: boolean; scaleY: 1 | -1 }> = [
    { angle: 0, mirrorBelly: false, scaleY: 1 },
    { angle: Math.PI / 4, mirrorBelly: false, scaleY: 1 },
    { angle: Math.PI / 2, mirrorBelly: false, scaleY: 1 },
    { angle: (Math.PI * 3) / 4, mirrorBelly: true, scaleY: -1 },
    { angle: Math.PI, mirrorBelly: true, scaleY: -1 },
    { angle: (-Math.PI * 3) / 4, mirrorBelly: true, scaleY: -1 },
    { angle: -Math.PI / 2, mirrorBelly: false, scaleY: 1 },
    { angle: -Math.PI / 4, mirrorBelly: false, scaleY: 1 }
  ];

  for (const item of cases) {
    const result = lockedFishOrientationForAngle(item.angle);
    if (result.lockId !== EVOFISH_FISH_ORIENTATION_LOCK_ID || result.mirrorBelly !== item.mirrorBelly || result.scaleX !== 1 || !sameSign(result.scaleY, item.scaleY)) {
      throw new Error(`[EvoFish] Fish orientation lock broken: ${EVOFISH_FISH_ORIENTATION_LOCK_ID}`);
    }
  }
}
