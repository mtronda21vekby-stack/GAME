import type { EvoFishFormId } from "../core/types";
import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import { EVOFISH_FORMS } from "../content/forms";
import { getMutationBonus, getMutationTotalLevel } from "../content/mutations";
import { formForLevel, NEXT_MAX_TIER, tierMassBonus, xpToNextLevel, xpToNextTier } from "../content/progression";
import { damageFromForm, hpFromForm, radiusFromForm, speedFromForm } from "./createWorld";

export type NextKillReward = {
  xp: number;
  pearls: number;
  corals: number;
};

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.9, kind });
}

function hpWithMutations(state: NextEngineState, form: EvoFishFormId, tier: number) {
  return Math.round((hpFromForm(form) + tier * 12) * (1 + getMutationBonus(state.mutations, "hp")));
}

function damageWithMutations(state: NextEngineState, form: EvoFishFormId, tier: number) {
  return Math.round((damageFromForm(form) + tier * 3) * (1 + getMutationBonus(state.mutations, "damage")));
}

function speedWithMutations(state: NextEngineState, form: EvoFishFormId) {
  return speedFromForm(form) * (1 + getMutationBonus(state.mutations, "speed"));
}

function archetypeXpBonus(enemy: NextFishEntity) {
  if (enemy.aiType === "apex") return 2.7;
  if (enemy.aiType === "leviathan") return 2.2;
  if (enemy.aiType === "stalker") return 1.7;
  if (enemy.aiType === "brute") return 1.45;
  if (enemy.aiType === "hunter") return 1.22;
  if (enemy.aiType === "neutral") return 1.04;
  return 0.86;
}

function archetypeCurrencyBonus(enemy: NextFishEntity) {
  if (enemy.aiType === "apex") return 4.3;
  if (enemy.aiType === "leviathan") return 3.1;
  if (enemy.aiType === "stalker") return 2.15;
  if (enemy.aiType === "brute") return 1.85;
  if (enemy.aiType === "hunter") return 1.35;
  if (enemy.aiType === "neutral") return 1.05;
  return 0.9;
}

function syncApexStats(state: NextEngineState) {
  const apex = state.enemies.find((enemy) => enemy.aiType === "apex");
  state.stats.apexAlive = Boolean(apex);
  state.stats.apexName = apex ? "Apex Megalodon" : "Apex cleared";
  state.stats.apexHp = apex?.hp || 0;
  state.stats.apexHpMax = apex?.hpMax || 1;
}

function applyPlayerForm(state: NextEngineState, nextForm: EvoFishFormId) {
  const player = state.player;
  if (player.form === nextForm) return;

  const hpRatio = player.hp / Math.max(1, player.hpMax);
  player.form = nextForm;
  player.radius = Math.max(player.radius, radiusFromForm(nextForm));
  player.speed = speedWithMutations(state, nextForm);
  player.damage = damageWithMutations(state, nextForm, player.tier);
  player.hpMax = hpWithMutations(state, nextForm, player.tier);
  player.hp = Math.max(1, Math.round(player.hpMax * Math.max(0.55, hpRatio)));

  state.stats.formName = EVOFISH_FORMS[nextForm].name;
  state.stats.lastEvent = nextForm === "megalodon" ? "Эволюция: Мегалодон" : "Эволюция: Акула";
  addFloat(state, player.x, player.y - player.radius * 2.2, state.stats.lastEvent, "kill");
}

export function syncProgressionStats(state: NextEngineState) {
  const player = state.player;
  state.stats.mass = player.mass;
  state.stats.hp = player.hp;
  state.stats.hpMax = player.hpMax;
  state.stats.level = player.level;
  state.stats.tier = player.tier;
  state.stats.xp = player.xp;
  state.stats.xpToNext = player.xpToNext;
  state.stats.levelXp = player.levelXp;
  state.stats.levelXpToNext = player.levelXpToNext;
  state.stats.accountName = state.account.name;
  state.stats.accountLevel = state.account.level;
  state.stats.accountXp = state.account.xp;
  state.stats.accountXpToNext = state.account.xpToNext;
  state.stats.lastRunAccountXp = state.account.lastRunXp;
  state.stats.pearls = state.economy.pearls;
  state.stats.corals = state.economy.corals;
  state.stats.mutationLevel = getMutationTotalLevel(state.mutations);
  state.stats.achievementsUnlocked = Object.keys(state.achievements?.unlocked || {}).length;
  state.stats.craftBarrierT = state.craft.barrierT;
  state.stats.craftBiteBoostT = state.craft.biteBoostT;
  state.stats.craftSonarT = state.craft.sonarT;
  state.stats.downs = state.stats.downs || state.stats.deaths || 0;
  state.stats.deaths = state.stats.downs;
  state.stats.downed = Boolean(player.downed);
  state.stats.dead = state.stats.downed;
  state.stats.reviveTime = player.reviveT || player.respawnT || 0;
  state.stats.respawnTime = state.stats.reviveTime;
  state.stats.skinName = player.skin.name;
  state.stats.formName = EVOFISH_FORMS[player.form].name;
  syncApexStats(state);
}

export function refreshMutationStats(state: NextEngineState) {
  const player = state.player;
  const hpRatio = player.hp / Math.max(1, player.hpMax);
  player.hpMax = hpWithMutations(state, player.form, player.tier);
  player.hp = Math.max(1, Math.round(player.hpMax * Math.max(0.35, hpRatio)));
  player.damage = damageWithMutations(state, player.form, player.tier);
  player.speed = speedWithMutations(state, player.form);
  syncProgressionStats(state);
}

export function awardNextXp(state: NextEngineState, amount: number) {
  const player = state.player;
  const xp = Math.max(1, Math.round(amount));
  player.xp += xp;
  player.levelXp += xp;

  let leveled = false;
  let tiered = false;

  while (player.levelXp >= player.levelXpToNext) {
    player.levelXp -= player.levelXpToNext;
    player.level += 1;
    player.levelXpToNext = xpToNextLevel(player.level);
    leveled = true;
  }

  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.tier = Math.min(NEXT_MAX_TIER, player.tier + 1);
    player.xpToNext = xpToNextTier(player.tier);
    player.mass += tierMassBonus(player.tier);
    player.damage = damageWithMutations(state, player.form, player.tier);
    player.hpMax = hpWithMutations(state, player.form, player.tier);
    player.hp = player.hpMax;
    tiered = true;
    if (player.tier >= NEXT_MAX_TIER) break;
  }

  const nextForm = formForLevel(player.level, player.form);
  applyPlayerForm(state, nextForm);

  if (tiered) {
    state.stats.lastEvent = `Tier ${player.tier}`;
    addFloat(state, player.x, player.y - player.radius * 2.5, `TIER ${player.tier}`, "kill");
  } else if (leveled) {
    state.stats.lastEvent = `Level ${player.level}`;
    addFloat(state, player.x, player.y - player.radius * 2.5, `LV ${player.level}`, "kill");
  }

  syncProgressionStats(state);
  return xp;
}

function awardKillEconomy(state: NextEngineState, enemy: NextFishEntity, source: "bite" | "devour") {
  const sourceBonus = source === "devour" ? 1.08 : 1;
  const mutationBonus = 1 + getMutationBonus(state.mutations, "reward");
  const zoneBonus = state.stats.zoneRewardBoost || 1;
  const familyBonus = enemy.familyRewardMultiplier || 1;
  const archetypeBonus = archetypeCurrencyBonus(enemy);
  const pearls = Math.max(1, Math.round((1 + enemy.mass * 1.35) * sourceBonus * archetypeBonus * mutationBonus * zoneBonus * familyBonus));
  const bossCorals = enemy.aiType === "apex" ? 3 : enemy.aiType === "leviathan" ? 2 : 0;
  const coralChance = Math.min(0.075, (0.004 + enemy.mass * 0.003 + (enemy.aiType === "brute" ? 0.018 : 0) + (enemy.aiType === "stalker" ? 0.012 : 0)) * Math.max(0.75, Math.min(1.35, zoneBonus)));
  const corals = bossCorals || (Math.random() < coralChance ? 1 : 0);

  state.economy.pearls += pearls;
  state.economy.corals += corals;
  return { pearls, corals };
}

export function awardKillReward(state: NextEngineState, enemy: NextFishEntity, source: "bite" | "devour"): NextKillReward {
  const formBonus = enemy.form === "shark" ? 1.18 : enemy.form === "megalodon" ? 1.55 : 1;
  const sourceBonus = source === "devour" ? 1.08 : 1;
  const zoneBonus = state.stats.zoneRewardBoost || 1;
  const familyBonus = enemy.familyRewardMultiplier || 1;
  const archetypeBonus = archetypeXpBonus(enemy);
  const xp = awardNextXp(state, (24 + enemy.mass * 16 + enemy.hpMax * 0.08) * formBonus * sourceBonus * archetypeBonus * zoneBonus * familyBonus);
  const economy = awardKillEconomy(state, enemy, source);

  if (enemy.aiType === "apex" || enemy.aiType === "leviathan") {
    state.stats.lastEvent = `${enemy.aiType.toUpperCase()} cleared +${xp} XP +${economy.pearls} жемчуг +${economy.corals} коралл`;
    addFloat(state, enemy.x, enemy.y - enemy.radius * 3.2, `${enemy.aiType.toUpperCase()} CLEARED`, "kill");
  }

  syncProgressionStats(state);
  return { xp, ...economy };
}
