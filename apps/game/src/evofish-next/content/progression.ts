import type { EvoFishFormId } from "../core/types";

export const NEXT_MAX_TIER = 12;
export const NEXT_SHARK_UNLOCK_LEVEL = 50;
export const NEXT_MEGALODON_UNLOCK_LEVEL = 100;

export function xpToNextTier(tier: number) {
  return Math.round(150 * Math.pow(1.38, Math.max(0, tier - 1)));
}

export function xpToNextLevel(level: number) {
  return Math.round(185 * Math.pow(1.145, Math.max(0, level - 1)));
}

export function formForLevel(level: number, currentForm: EvoFishFormId): EvoFishFormId {
  if (currentForm === "megalodon") return "megalodon";
  if (currentForm === "shark" && level < NEXT_MEGALODON_UNLOCK_LEVEL) return "shark";
  if (level >= NEXT_MEGALODON_UNLOCK_LEVEL) return "megalodon";
  if (level >= NEXT_SHARK_UNLOCK_LEVEL) return "shark";
  return "fish";
}

export function tierMassBonus(tier: number) {
  return 0.12 + tier * 0.024;
}
