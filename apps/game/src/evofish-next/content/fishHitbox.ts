import type { NextFishEntity } from "../core/engineTypes";
import type { EvoFishFormId } from "../core/types";
import type { NextEnemyArchetypeId } from "./enemyArchetypes";

export const EVOFISH_SHARED_FISH_HITBOX_RADIUS = 24;

type FishLike = Pick<NextFishEntity, "form" | "mass" | "aiType"> & { angle?: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formScale(form: EvoFishFormId) {
  if (form === "megalodon") return 5.25;
  if (form === "shark") return 4.95;
  return 4.62;
}

function fallbackAspect(form: EvoFishFormId) {
  return form === "fish" ? 0.42 : 0.38;
}

export function visualRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const formBase = form === "megalodon" ? 39 : form === "shark" ? 31 : EVOFISH_SHARED_FISH_HITBOX_RADIUS;
  const massBonusLimit = form === "megalodon" ? 24 : form === "shark" ? 19 : 15;
  const massBonus = Math.min(massBonusLimit, Math.sqrt(Math.max(0, mass)) * 3.1);
  const archetypeBonus = aiType === "leviathan" ? 18 : aiType === "apex" ? 14 : aiType === "stalker" ? 7 : aiType === "brute" ? 4 : 0;

  return formBase + massBonus + archetypeBonus;
}

export function fishVisualSize(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const radius = visualRadiusForFish(form, mass, aiType);
  const width = radius * formScale(form);
  return { width, height: width * fallbackAspect(form) };
}

export function fishHitboxMetrics(entity: FishLike) {
  const size = fishVisualSize(entity.form, entity.mass, entity.aiType);
  const lengthFactor = entity.form === "megalodon" ? 0.36 : entity.form === "shark" ? 0.37 : 0.38;
  const heightFactor = entity.form === "megalodon" ? 0.36 : entity.form === "shark" ? 0.38 : 0.40;
  return {
    halfLength: clamp(size.width * lengthFactor, 24, entity.form === "megalodon" ? 128 : entity.form === "shark" ? 108 : 86),
    halfHeight: clamp(size.height * heightFactor, 12, entity.form === "megalodon" ? 48 : entity.form === "shark" ? 42 : 34)
  };
}

export function gameplayRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const metrics = fishHitboxMetrics({ form, mass, aiType });
  return Math.max(metrics.halfLength, metrics.halfHeight);
}

function radiusAlongDirection(entity: FishLike, dx: number, dy: number) {
  const metrics = fishHitboxMetrics(entity);
  const length = Math.hypot(dx, dy) || 1;
  const nx = dx / length;
  const ny = dy / length;
  const angle = entity.angle || 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const localX = nx * cos + ny * sin;
  const localY = -nx * sin + ny * cos;
  const a = metrics.halfLength;
  const b = metrics.halfHeight;
  return (a * b) / Math.max(1, Math.sqrt((b * localX) ** 2 + (a * localY) ** 2));
}

export function biteRadiusForFish(form: EvoFishFormId, mass: number, aiType?: NextEnemyArchetypeId) {
  const metrics = fishHitboxMetrics({ form, mass, aiType });
  const reach = form === "megalodon" ? 1.14 : form === "shark" ? 1.18 : 1.24;
  return metrics.halfLength * reach;
}

export function entityGameplayRadius(entity: FishLike) {
  return gameplayRadiusForFish(entity.form, entity.mass, entity.aiType);
}

export function entityBiteRadius(entity: FishLike) {
  return biteRadiusForFish(entity.form, entity.mass, entity.aiType);
}

export function contactDistanceForFish(a: FishLike, b: FishLike, dx = 1, dy = 0) {
  return radiusAlongDirection(a, dx, dy) + radiusAlongDirection(b, -dx, -dy);
}

export function biteDistanceForFish(attacker: FishLike, target: FishLike, dx = 1, dy = 0) {
  const forwardReach = entityBiteRadius(attacker);
  const targetBody = radiusAlongDirection(target, -dx, -dy);
  return forwardReach + targetBody * 0.92;
}
