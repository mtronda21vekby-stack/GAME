import type { NextEnemyArchetypeId } from "./enemyArchetypes";

export type EnemyLevelBandKind = "normal" | "strong" | "big";

export type EnemyPopulationMix = {
  normal: number;
  strong: number;
  big: number;
};

export type EnemyBandRules = {
  kind: EnemyLevelBandKind;
  minLevel: number;
  maxLevel: number;
  minDistance: number;
  safeDistance: number;
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  aggroMultiplier: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function playerLevelAnchor(playerLevel: number) {
  return Math.max(1, Math.floor(playerLevel || 1));
}

export function enemyPopulationMix(enemyTarget: number): EnemyPopulationMix {
  const total = Math.max(1, Math.floor(enemyTarget || 1));
  const big = Math.min(3, Math.max(2, Math.round(total * 0.06)));
  const strong = Math.max(4, Math.round(total * 0.16));
  return {
    big,
    strong,
    normal: Math.max(1, total - strong - big)
  };
}

export function enemyBandForIndex(index: number, enemyTarget: number): EnemyLevelBandKind {
  const mix = enemyPopulationMix(enemyTarget);
  const slot = Math.max(0, Math.floor(index || 0));
  if (slot >= enemyTarget - mix.big) return "big";
  if (slot >= enemyTarget - mix.big - mix.strong) return "strong";
  return "normal";
}

export function enemyBandRules(playerLevel: number, kind: EnemyLevelBandKind, zoneRisk = 1): EnemyBandRules {
  const level = playerLevelAnchor(playerLevel);
  const risk = clamp(Math.floor(zoneRisk || 1), 0, 5);

  if (kind === "big") {
    const min = level + 12 + Math.max(0, risk - 2);
    return {
      kind,
      minLevel: min,
      maxLevel: level + 20 + Math.max(0, risk - 3) * 2,
      minDistance: 1650,
      safeDistance: 1550,
      hpMultiplier: 1.08,
      damageMultiplier: 1.05,
      speedMultiplier: 0.96,
      aggroMultiplier: 0.86
    };
  }

  if (kind === "strong") {
    return {
      kind,
      minLevel: level + 6,
      maxLevel: level + 10 + Math.max(0, risk - 3),
      minDistance: 940,
      safeDistance: 900,
      hpMultiplier: 1.02,
      damageMultiplier: 0.98,
      speedMultiplier: 0.98,
      aggroMultiplier: 0.9
    };
  }

  return {
    kind,
    minLevel: Math.max(1, level - 5),
    maxLevel: level + 5,
    minDistance: 0,
    safeDistance: 0,
    hpMultiplier: 0.96,
    damageMultiplier: 0.94,
    speedMultiplier: 0.98,
    aggroMultiplier: 0.94
  };
}

export function clampEnemyLevelToBand(level: number, playerLevel: number, kind: EnemyLevelBandKind, zoneRisk = 1) {
  const rules = enemyBandRules(playerLevel, kind, zoneRisk);
  return Math.round(clamp(Math.floor(level || rules.minLevel), rules.minLevel, rules.maxLevel));
}

export function maxNearbyEnemyLevel(playerLevel: number) {
  return playerLevelAnchor(playerLevel) + 5;
}

export function respawnSafetyRules(playerLevel: number) {
  const level = playerLevelAnchor(playerLevel);
  return {
    safeRadius: level <= 3 ? 1400 : level <= 25 ? 1280 : 1160,
    nearbyMaxLevel: level + 5,
    strongMinDistance: 1000,
    bigMinDistance: 1700,
    invuln: 5.2
  };
}

export function shouldForceBigFish(archetype: NextEnemyArchetypeId, kind: EnemyLevelBandKind) {
  if (kind !== "big") return false;
  return archetype !== "apex" && archetype !== "leviathan" && archetype !== "stalker" && archetype !== "brute";
}
