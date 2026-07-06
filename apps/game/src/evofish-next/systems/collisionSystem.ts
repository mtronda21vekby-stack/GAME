import type { NextEngineState, NextFishEntity, NextPlayerState } from "../core/engineTypes";
import { enemyThreatLevel, makeEnemy, radiusFromForm } from "./createWorld";
import { awardKillReward } from "./progressionSystem";

export const DEVOUR_MAX_LEVEL_GAP = 6;

export function canDevour(attackerMass: number, targetMass: number) {
  return attackerMass >= targetMass * 1.18;
}

export function npcCombatLevel(enemy: NextFishEntity) {
  return Math.max(1, Math.floor(enemy.npcLevel || Math.max(1, Math.round(enemy.mass * 4))));
}

export function npcLevelGap(player: Pick<NextPlayerState, "level">, enemy: NextFishEntity) {
  return npcCombatLevel(enemy) - Math.max(1, Math.floor(player.level || 1));
}

export function canPlayerDevour(player: NextPlayerState, enemy: NextFishEntity) {
  const gap = npcLevelGap(player, enemy);
  if (gap > DEVOUR_MAX_LEVEL_GAP) return false;

  const levelMassPenalty = 1 + Math.max(0, gap) * 0.055;
  const elitePenalty = enemy.aiType === "apex" || enemy.aiType === "leviathan" ? 1.35 : enemy.aiType === "stalker" ? 1.18 : 1;
  return player.mass >= enemy.mass * 1.18 * levelMassPenalty * elitePenalty;
}

export function playerDamageMultiplierAgainstEnemy(player: NextPlayerState, enemy: NextFishEntity) {
  const gap = npcLevelGap(player, enemy);
  if (gap <= 0) return 1;
  if (gap >= 18) return 0.25;
  if (gap >= 12) return 0.34;
  if (gap >= 8) return 0.48;
  if (gap >= 4) return 0.68;
  return 0.84;
}

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.75, kind });
}

function respawnEnemy(state: NextEngineState) {
  const player = state.player;
  const threat = enemyThreatLevel(player.level, player.tier, player.mass);
  return makeEnemy(1000 + state.stats.kills + state.frame, state.config, threat, player.mass, player.x, player.y, 720, player.level);
}

function devourEnemy(state: NextEngineState, enemy: NextFishEntity, index: number) {
  const player = state.player;
  const massGain = enemy.mass * 0.055;
  const reward = awardKillReward(state, enemy, "devour");

  player.mass += massGain;
  player.radius = radiusFromForm(player.form);
  player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.055);
  state.stats.kills += 1;
  state.stats.lastEvent = `Поглощение +${reward.xp} XP +${reward.pearls} жемчуг${reward.corals ? ` +${reward.corals} коралл` : ""} +${massGain.toFixed(2)} Mass`;
  addFloat(state, enemy.x, enemy.y, `EAT +${reward.xp}XP +${reward.pearls}P`, "kill");
  if (reward.corals) addFloat(state, enemy.x, enemy.y - enemy.radius * 2.5, `+${reward.corals} CORAL`, "kill");
  state.enemies.splice(index, 1, respawnEnemy(state));
}

function contactDamage(state: NextEngineState, enemy: NextFishEntity) {
  const player = state.player;
  if (player.invulnT > 0) return;

  const gap = npcLevelGap(player, enemy);
  const levelBonus = gap > 0 ? 1 + Math.min(0.75, gap * 0.045) : 1;
  const damage = Math.round(enemy.damage * levelBonus);
  player.hp = Math.max(0, player.hp - damage);
  player.hitT = 0.22;
  player.invulnT = 0.55;
  player.vx -= Math.cos(player.angle) * 80;
  player.vy -= Math.sin(player.angle) * 80;
  state.stats.lastEvent = gap > DEVOUR_MAX_LEVEL_GAP ? `Слишком высокий LV ${npcCombatLevel(enemy)} · Урон -${damage}` : `Урон -${damage}`;
  addFloat(state, player.x, player.y - player.radius * 2, gap > DEVOUR_MAX_LEVEL_GAP ? `LV ${npcCombatLevel(enemy)}` : `-${damage} HP`, "danger");
}

export function updateCollisionSystem(state: NextEngineState) {
  const player = state.player;

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);

    if (distance < player.radius + enemy.radius) {
      if (canPlayerDevour(player, enemy)) devourEnemy(state, enemy, index);
      else contactDamage(state, enemy);
    }
  }

  state.stats.mass = player.mass;
  state.stats.hp = player.hp;
  state.stats.hpMax = player.hpMax;
}
