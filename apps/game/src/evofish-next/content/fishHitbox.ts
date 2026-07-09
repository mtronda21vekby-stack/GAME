import type { NextFishEntity } from "../core/engineTypes";
import type { EvoFishFormId } from "../core/types";
import type { NextEnemyArchetypeId } from "./enemyArchetypes";

export const EVOFISH_SHARED_FISH_HITBOX_RADIUS = 24;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function visualRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const formBase = form === "megalodon" ? 39 : form === "shark" ? 31 : EVOFISH_SHARED_FISH_HITBOX_RADIUS;
  const massBonusLimit = form === "megalodon" ? 24 : form === "shark" ? 19 : 15;
  const massBonus = Math.min(massBonusLimit, Math.sqrt(Math.max(0, mass)) * 3.1);
  const archetypeBonus = aiType === "leviathan" ? 18 : aiType === "apex" ? 14 : aiType === "stalker" ? 7 : aiType === "brute" ? 4 : 0;

  return formBase + massBonus + archetypeBonus;
}

export function gameplayRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const visual = visualRadiusForFish(form, mass, aiType);
  const factor = form === "megalodon" ? 0.34 : form === "shark" ? 0.36 : 0.38;
  const min = form === "megalodon" ? 26 : form === "shark" ? 20 : 15;
  const max = form === "megalodon" ? 44 : form === "shark" ? 34 : 26;
  return clamp(visual * factor, min, max);
}

export function biteRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const gameplay = gameplayRadiusForFish(form, mass, aiType);
  const factor = form === "megalodon" ? 1.82 : form === "shark" ? 1.92 : 2.08;
  return gameplay * factor;
}

export function entityGameplayRadius(entity: Pick<NextFishEntity, "form" | "mass" | "aiType">) {
  return gameplayRadiusForFish(entity.form, entity.mass, entity.aiType);
}

export function entityBiteRadius(entity: Pick<NextFishEntity, "form" | "mass" | "aiType">) {
  return biteRadiusForFish(entity.form, entity.mass, entity.aiType);
}

export function contactDistanceForFish(a: Pick<NextFishEntity, "form" | "mass" | "aiType">, b: Pick<NextFishEntity, "form" | "mass" | "aiType">) {
  return entityGameplayRadius(a) + entityGameplayRadius(b);
}

export function biteDistanceForFish(attacker: Pick<NextFishEntity, "form" | "mass" | "aiType">, target: Pick<NextFishEntity, "form" | "mass" | "aiType">) {
  return entityBiteRadius(attacker) + entityGameplayRadius(target) * 0.86;
}
