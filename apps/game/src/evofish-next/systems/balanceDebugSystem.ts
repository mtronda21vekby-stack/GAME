import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import { entityGameplayRadius } from "../content/fishHitbox";

const DEBUG_KEY = "evofish_next_balance_debug_v1";

type Band = "normal" | "strong" | "big";

function band(enemy: NextFishEntity): Band {
  if (enemy.balanceBand === "normal" || enemy.balanceBand === "strong" || enemy.balanceBand === "big") return enemy.balanceBand;
  if (enemy.aiType === "apex" || enemy.aiType === "leviathan" || enemy.aiType === "stalker") return "big";
  if (enemy.aiType === "brute" || enemy.aiType === "hunter") return "strong";
  return "normal";
}

function npcLevel(enemy: NextFishEntity) {
  return Math.max(1, Math.floor(enemy.npcLevel || Math.round(enemy.mass * 4)));
}

export function updateBalanceDebugSnapshot(state: NextEngineState) {
  if (typeof localStorage === "undefined") return;
  if (state.frame % 24 !== 0) return;

  let normal = 0;
  let strong = 0;
  let big = 0;
  let near = 0;
  let nearMin = Infinity;
  let nearMax = 0;
  let nearSum = 0;
  let minBigDistance = Infinity;
  let hitboxMin = Infinity;
  let hitboxMax = 0;

  for (const enemy of state.enemies) {
    const b = band(enemy);
    if (b === "big") big += 1;
    else if (b === "strong") strong += 1;
    else normal += 1;

    const hitbox = entityGameplayRadius(enemy);
    hitboxMin = Math.min(hitboxMin, hitbox);
    hitboxMax = Math.max(hitboxMax, hitbox);

    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    if (b === "big") minBigDistance = Math.min(minBigDistance, distance);

    if (distance <= 950) {
      const level = npcLevel(enemy);
      near += 1;
      nearMin = Math.min(nearMin, level);
      nearMax = Math.max(nearMax, level);
      nearSum += level;
    }
  }

  const snapshot = {
    version: 1,
    frame: state.frame,
    playerLevel: state.player.level,
    enemyTarget: state.config.enemyTarget,
    normal,
    strong,
    big,
    near,
    nearMin: near ? nearMin : 0,
    nearMax,
    nearAvg: near ? nearSum / near : 0,
    minBigDistance: Number.isFinite(minBigDistance) ? Math.round(minBigDistance) : 0,
    playerHitbox: Math.round(entityGameplayRadius(state.player)),
    enemyHitboxMin: Number.isFinite(hitboxMin) ? Math.round(hitboxMin) : 0,
    enemyHitboxMax: Math.round(hitboxMax),
    director: state.stats.aiDirectorMode || "normal"
  };

  try {
    localStorage.setItem(DEBUG_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new Event("evofish_balance_debug_changed"));
  } catch {
    // optional debug snapshot
  }
}

export function readBalanceDebugSnapshot() {
  try {
    const raw = localStorage.getItem(DEBUG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
