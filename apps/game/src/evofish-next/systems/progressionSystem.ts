import type { EvoFishFormId } from "../core/types";
import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import { EVOFISH_FORMS } from "../content/forms";
import { formForLevel, NEXT_MAX_TIER, tierMassBonus, xpToNextLevel, xpToNextTier } from "../content/progression";
import { damageFromForm, hpFromForm, radiusFromForm, speedFromForm } from "./createWorld";

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.9, kind });
}

function applyPlayerForm(state: NextEngineState, nextForm: EvoFishFormId) {
  const player = state.player;
  if (player.form === nextForm) return;

  const hpRatio = player.hp / Math.max(1, player.hpMax);
  player.form = nextForm;
  player.radius = Math.max(player.radius, radiusFromForm(nextForm));
  player.speed = speedFromForm(nextForm);
  player.damage = damageFromForm(nextForm) + player.tier * 3;
  player.hpMax = hpFromForm(nextForm) + player.tier * 12;
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
  state.stats.skinName = player.skin.name;
  state.stats.formName = EVOFISH_FORMS[player.form].name;
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
    player.damage = damageFromForm(player.form) + player.tier * 3;
    player.hpMax = hpFromForm(player.form) + player.tier * 12;
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

export function awardKillProgression(state: NextEngineState, enemy: NextFishEntity, source: "bite" | "devour") {
  const formBonus = enemy.form === "shark" ? 1.45 : enemy.form === "megalodon" ? 2.25 : 1;
  const sourceBonus = source === "devour" ? 1.2 : 1;
  const archetypeBonus = enemy.aiType === "brute" ? 1.65 : enemy.aiType === "hunter" ? 1.3 : 1;
  const xp = (35 + enemy.mass * 28 + enemy.hpMax * 0.22) * formBonus * sourceBonus * archetypeBonus;
  return awardNextXp(state, xp);
}
