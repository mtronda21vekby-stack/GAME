import type { EvoFishFormId } from "../core/types";

export const NEXT_MAX_TIER = 12;

export function xpToNextTier(tier: number) {
  return Math.round(90 * Math.pow(1.36, Math.max(0, tier - 1)));
}

export function xpToNextLevel(level: number) {
  return Math.round(140 * Math.pow(1.12, Math.max(0, level - 1)));
}

export function formForLevel(level: number, currentForm: EvoFishFormId): EvoFishFormId {
  if (currentForm === "megalodon") return "megalodon";
  if (currentForm === "shark" && level < 60) return "shark";
  if (level >= 60) return "megalodon";
  if (level >= 30) return "shark";
  return "fish";
}

export function tierMassBonus(tier: number) {
  return 0.16 + tier * 0.035;
}
