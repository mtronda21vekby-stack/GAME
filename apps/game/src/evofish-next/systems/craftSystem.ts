import type { NextEngineState } from "../core/engineTypes";
import { NEXT_CRAFT_RECIPES, type NextCraftRecipe } from "../content/craft";

function addFloat(state: NextEngineState, text: string) {
  const player = state.player;
  state.floats.push({ id: state.nextFloatId++, x: player.x, y: player.y - player.radius * 2.9, text, ttl: 1.05, kind: "kill" });
}

function hasCost(state: NextEngineState, recipe: NextCraftRecipe) {
  return state.economy.pearls >= (recipe.cost.pearls || 0) && state.economy.corals >= (recipe.cost.corals || 0);
}

function payCost(state: NextEngineState, recipe: NextCraftRecipe) {
  state.economy.pearls -= recipe.cost.pearls || 0;
  state.economy.corals -= recipe.cost.corals || 0;
}

function syncCraftStats(state: NextEngineState) {
  state.stats.craftBarrierT = state.craft.barrierT;
  state.stats.craftBiteBoostT = state.craft.biteBoostT;
  state.stats.craftSonarT = state.craft.sonarT;
}

function bumpQuestCounter(state: NextEngineState, key: string, amount = 1) {
  state.quests.counters = state.quests.counters || {};
  state.quests.counters[key] = Math.max(0, Math.floor((state.quests.counters[key] || 0) + amount));
}

export function canCraftRecipe(state: NextEngineState, recipeId: string) {
  const recipe = NEXT_CRAFT_RECIPES.find((item) => item.id === recipeId);
  if (!recipe) return false;
  if (!hasCost(state, recipe)) return false;
  if (recipe.effect === "heal" && state.player.hp >= state.player.hpMax) return false;
  return true;
}

export function applyCraftRecipe(state: NextEngineState, recipeId: string) {
  const recipe = NEXT_CRAFT_RECIPES.find((item) => item.id === recipeId);
  if (!recipe || !canCraftRecipe(state, recipeId)) return false;

  payCost(state, recipe);
  state.stats.craftUses = (state.stats.craftUses || 0) + 1;
  bumpQuestCounter(state, "craft");

  if (recipe.effect === "heal") {
    const heal = Math.round(state.player.hpMax * recipe.value);
    state.player.hp = Math.min(state.player.hpMax, state.player.hp + heal);
    state.stats.lastEvent = `${recipe.name}: +${heal} HP`;
    addFloat(state, `+${heal} HP`);
  }

  if (recipe.effect === "barrier") {
    state.craft.barrierT = Math.max(state.craft.barrierT, recipe.duration);
    state.player.invulnT = Math.max(state.player.invulnT, 0.4);
    state.stats.lastEvent = `${recipe.name}: защита ${recipe.duration}с`;
    addFloat(state, "BARRIER");
  }

  if (recipe.effect === "bite_boost") {
    state.craft.biteBoostT = Math.max(state.craft.biteBoostT, recipe.duration);
    state.stats.lastEvent = `${recipe.name}: bite +${Math.round(recipe.value * 100)}%`;
    addFloat(state, "BITE BOOST");
  }

  if (recipe.effect === "sonar") {
    state.craft.sonarT = Math.max(state.craft.sonarT, recipe.duration);
    state.stats.lastEvent = `${recipe.name}: mini-map ${recipe.duration}с`;
    addFloat(state, "SONAR");
  }

  syncCraftStats(state);
  return true;
}

export function updateCraftSystem(state: NextEngineState, dt: number) {
  state.craft.barrierT = Math.max(0, state.craft.barrierT - dt);
  state.craft.biteBoostT = Math.max(0, state.craft.biteBoostT - dt);
  state.craft.sonarT = Math.max(0, state.craft.sonarT - dt);

  if (state.craft.barrierT > 0 && !state.player.downed && !state.player.dead) {
    state.player.invulnT = Math.max(state.player.invulnT, 0.18);
  }

  syncCraftStats(state);
}
