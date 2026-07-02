import type { EvoFishFormId } from "../core/types";

export const NEXT_MAX_TIER = 12;

export function xpToNextTier(tier: number) {
  return Math.round(140 * Math.pow(1.42, Math.max(0, tier - 1)));
}

export function xpToNextLevel(level: number) {
  return Math.round(220 * Math.pow(1.16, Math.max(0, level - 1)));
}

export function formForLevel(level: number, currentForm: EvoFishFormId): EvoFishFormId {
  if (currentForm === "megalodon") return "megalodon";
  if (currentForm === "shark" && level < 65) return "shark";
  if (level >= 65) return "megalodon";
  if (level >= 35) return "shark";
  return "fish";
}

export function tierMassBonus(tier: number) {
  return 0.11 + tier * 0.026;
}
