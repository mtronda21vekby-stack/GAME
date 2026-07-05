import type { NextEnemyArchetypeId } from "./enemyArchetypes";
import type { EvoFishFormId } from "../core/types";

export const EVOFISH_SHARED_FISH_HITBOX_RADIUS = 24;

export function visualRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const formBase = form === "megalodon" ? 39 : form === "shark" ? 31 : EVOFISH_SHARED_FISH_HITBOX_RADIUS;
  const massBonusLimit = form === "megalodon" ? 24 : form === "shark" ? 19 : 15;
  const massBonus = Math.min(massBonusLimit, Math.sqrt(Math.max(0, mass)) * 3.1);
  const archetypeBonus = aiType === "leviathan" ? 18 : aiType === "apex" ? 14 : aiType === "stalker" ? 7 : aiType === "brute" ? 4 : 0;

  return formBase + massBonus + archetypeBonus;
}
