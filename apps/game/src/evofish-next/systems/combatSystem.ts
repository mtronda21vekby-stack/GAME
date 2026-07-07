import type { NextEngineState, NextFishEntity, NextInputState, NextCameraState } from "../core/engineTypes";
import { enemyThreatLevel, makeEnemy, radiusFromForm } from "./createWorld";
import { canPlayerDevour, npcCombatLevel, npcLevelGap, playerDamageMultiplierAgainstEnemy } from "./collisionSystem";
import { awardKillReward } from "./progressionSystem";
import { aimVector } from "./playerSystem";

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.75, kind });
}

function rewardText(reward: { xp: number; pearls: number; corals: number }) {
  return `+${reward.xp} XP +${reward.pearls} жемчуг${reward.corals ? ` +${reward.corals} коралл` : ""}`;
}

function respawnEnemy(state: NextEngineState) {
  const player = state.player;
  const threat = enemyThreatLevel(player.level, player.tier, player.mass);
  const safeRadius = player.level <= 25 ? 980 : player.level <= 35 ? 780 : 720;
  return makeEnemy(1000 + state.stats.kills + state.frame, state.config, threat, player.mass, player.x, player.y, safeRadius, player.level);
}

function defeatEnemy(state: NextEngineState, enemy: NextFishEntity, index: number, source: "bite" | "devour") {
  const player = state.player;
  const massGain = enemy.mass * (source === "devour" ? 0.055 : 0.032);
  const reward = awardKillReward(state, enemy, source);

  player.mass += massGain;
  player.radius = radiusFromForm(player.form);
  player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.045);

  state.stats.kills += 1;
  state.stats.lastEvent = `Победа LV ${npcCombatLevel(enemy)} ${rewardText(reward)} +${massGain.toFixed(2)} Mass`;
  addFloat(state, enemy.x, enemy.y, `LV${npcCombatLevel(enemy)} +${reward.xp}XP`, "kill");
  if (reward.corals) addFloat(state, enemy.x, enemy.y - enemy.radius * 2.5, `+${reward.corals} CORAL`, "kill");
  state.enemies.splice(index, 1, respawnEnemy(state));
}

function biteTargetScore(state: NextEngineState, enemy: NextFishEntity, distance: number, dot: number, range: number) {
  const player = state.player;
  const edible = canPlayerDevour(player, enemy) ? 70 : 0;
  const finishable = enemy.hp <= player.damage * 1.45 ? 36 : 0;
  const levelGap = npcLevelGap(player, enemy);
  const levelPenalty = levelGap > 6 ? Math.min(42, (levelGap - 6) * 4) : 0;
  return edible + finishable + dot * 22 + (range - distance) * 0.35 - levelPenalty;
}

function findBiteTarget(state: NextEngineState, camera: NextCameraState, input: NextInputState) {
  const player = state.player;
  const aim = input.down ? aimVector(state, input, camera) : { x: Math.cos(player.angle), y: Math.sin(player.angle) };
  const nx = aim.x;
  const ny = aim.y;
  let bestIndex = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const range = player.radius * 2.55 + enemy.radius;
    if (distance > range) continue;
    const dot = (dx / (distance || 1)) * nx + (dy / (distance || 1)) * ny;
    if (dot < 0.2) continue;
    const score = biteTargetScore(state, enemy, distance, dot, range);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function updateCombatSystem(state: NextEngineState, input: NextInputState, camera: NextCameraState) {
  const player = state.player;

  if (!input.bite) return;
  input.bite = false;

  if (player.biteCd > 0) return;
  player.biteCd = state.craft.biteBoostT > 0 ? 0.25 : 0.34;

  const targetIndex = findBiteTarget(state, camera, input);
  if (targetIndex < 0) {
    state.stats.lastEvent = "Укус мимо";
    addFloat(state, player.x + Math.cos(player.angle) * player.radius * 1.7, player.y + Math.sin(player.angle) * player.radius * 1.7, "MISS", "danger");
    return;
  }

  const enemy = state.enemies[targetIndex];
  const craftBoost = state.craft.biteBoostT > 0 ? 1.35 : 1;
  const levelMultiplier = playerDamageMultiplierAgainstEnemy(player, enemy);
  const gap = npcLevelGap(player, enemy);
  const readableBonus = gap <= 2 ? 1.08 : gap >= 10 ? 0.92 : 1;
  const damage = Math.max(1, Math.round(player.damage * (player.dashT > 0 ? 1.35 : 1) * craftBoost * levelMultiplier * readableBonus));
  enemy.hp -= damage;
  enemy.hitT = 0.18;
  enemy.vx += Math.cos(player.angle) * 120;
  enemy.vy += Math.sin(player.angle) * 120;

  const nerfed = levelMultiplier < 1;
  state.stats.lastEvent = nerfed ? `Укус по LV ${npcCombatLevel(enemy)} x${levelMultiplier.toFixed(2)} -${damage}` : state.craft.biteBoostT > 0 ? `Укус BOOST -${damage}` : `Укус -${damage}`;
  addFloat(state, enemy.x, enemy.y - enemy.radius * 1.8, nerfed ? `LV${npcCombatLevel(enemy)} -${damage}` : `-${damage}`, "damage");

  if (enemy.hp <= 0) {
    defeatEnemy(state, enemy, targetIndex, "bite");
    return;
  }

  if (canPlayerDevour(player, enemy)) {
    defeatEnemy(state, enemy, targetIndex, "bite");
  } else if (gap > 6 && enemy.hp > 0) {
    addFloat(state, enemy.x, enemy.y - enemy.radius * 2.6, "TOO HIGH LV", "danger");
  }
}

export function devourEnemyOnContact(state: NextEngineState, enemy: NextFishEntity, index: number) {
  defeatEnemy(state, enemy, index, "devour");
}
