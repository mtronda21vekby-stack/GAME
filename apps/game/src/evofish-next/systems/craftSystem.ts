import type { NextEngineState } from "../core/engineTypes";
import { NEXT_CRAFT_RECIPES, normalizeCraftState, type NextCraftInventory, type NextCraftRecipe } from "../content/craft";

const CRAFT_INVENTORY_KEY = "evofish_next_craft_inventory_v1";

function addFloat(state: NextEngineState, text: string) {
  const player = state.player;
  state.floats.push({ id: state.nextFloatId++, x: player.x, y: player.y - player.radius * 2.9, text, ttl: 1.05, kind: "kill" });
}

function readStoredInventory(): Partial<NextCraftInventory> {
  try {
    const raw = localStorage.getItem(CRAFT_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredInventory(inventory: NextCraftInventory) {
  try {
    localStorage.setItem(CRAFT_INVENTORY_KEY, JSON.stringify(inventory));
  } catch {
    // local craft inventory is optional in private modes
  }
}

function recipeById(recipeId: string) {
  return NEXT_CRAFT_RECIPES.find((item) => item.id === recipeId) || null;
}

function normalizeCraft(state: NextEngineState) {
  state.craft = normalizeCraftState({
    ...state.craft,
    inventory: {
      ...readStoredInventory(),
      ...(state.craft?.inventory || {})
    }
  });
  return state.craft;
}

function persistCraft(state: NextEngineState) {
  writeStoredInventory(normalizeCraft(state).inventory);
}

function stock(state: NextEngineState, recipeId: string) {
  const craft = normalizeCraft(state);
  return Math.max(0, Math.floor(craft.inventory[recipeId] || 0));
}

function hasCost(state: NextEngineState, recipe: NextCraftRecipe) {
  return state.economy.pearls >= (recipe.cost.pearls || 0) && state.economy.corals >= (recipe.cost.corals || 0);
}

function payCost(state: NextEngineState, recipe: NextCraftRecipe) {
  state.economy.pearls -= recipe.cost.pearls || 0;
  state.economy.corals -= recipe.cost.corals || 0;
}

function syncCraftStats(state: NextEngineState) {
  const craft = normalizeCraft(state);
  state.stats.craftBarrierT = craft.barrierT;
  state.stats.craftBiteBoostT = craft.biteBoostT;
  state.stats.craftSonarT = craft.sonarT;
}

function bumpQuestCounter(state: NextEngineState, key: string, amount = 1) {
  state.quests.counters = state.quests.counters || {};
  state.quests.counters[key] = Math.max(0, Math.floor((state.quests.counters[key] || 0) + amount));
}

function activateCraftEffect(state: NextEngineState, recipe: NextCraftRecipe) {
  if (recipe.effect === "heal") {
    const heal = Math.round(state.player.hpMax * recipe.value);
    state.player.hp = Math.min(state.player.hpMax, state.player.hp + heal);
    state.stats.lastEvent = `${recipe.name}: +${heal} HP`;
    addFloat(state, `+${heal} HP`);
  }

  if (recipe.effect === "barrier") {
    state.craft.barrierT = Math.max(state.craft.barrierT, recipe.duration);
    state.player.invulnT = Math.max(state.player.invulnT, 0.6);
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

  if (recipe.effect === "cleanse") {
    const heal = Math.round(state.player.hpMax * recipe.value);
    state.player.hp = Math.min(state.player.hpMax, state.player.hp + heal);
    state.player.invulnT = Math.max(state.player.invulnT, recipe.duration);
    state.player.dashCd = Math.min(state.player.dashCd, 0.12);
    state.stats.lastEvent = `${recipe.name}: safe +${heal} HP`;
    addFloat(state, "CLEANSE");
  }

  if (recipe.effect === "overdrive") {
    state.craft.biteBoostT = Math.max(state.craft.biteBoostT, recipe.duration);
    state.craft.overdriveT = Math.max(state.craft.overdriveT, recipe.duration);
    state.player.invulnT = Math.max(state.player.invulnT, 0.9);
    state.player.dashCd = 0;
    state.stats.lastEvent = `${recipe.name}: overdrive ${recipe.duration}с`;
    addFloat(state, "APEX MODE");
  }
}

export function canBuyCraftItem(state: NextEngineState, recipeId: string) {
  const recipe = recipeById(recipeId);
  if (!recipe) return false;
  const current = stock(state, recipeId);
  if (current >= (recipe.maxStack || 99)) return false;
  return hasCost(state, recipe);
}

export function buyCraftItem(state: NextEngineState, recipeId: string, amount = 1) {
  const recipe = recipeById(recipeId);
  if (!recipe) return false;
  const craft = normalizeCraft(state);
  let bought = 0;
  const maxStack = recipe.maxStack || 99;
  const requested = Math.max(1, Math.min(99, Math.floor(amount || 1)));

  while (bought < requested && (craft.inventory[recipeId] || 0) < maxStack && hasCost(state, recipe)) {
    payCost(state, recipe);
    craft.inventory[recipeId] = Math.min(maxStack, (craft.inventory[recipeId] || 0) + 1);
    bought += 1;
  }

  if (bought <= 0) return false;
  state.stats.lastEvent = `${recipe.name}: куплено x${bought}`;
  addFloat(state, `+${recipe.shortName} x${bought}`);
  persistCraft(state);
  syncCraftStats(state);
  return true;
}

export function canUseCraftItem(state: NextEngineState, recipeId: string) {
  const recipe = recipeById(recipeId);
  if (!recipe) return false;
  if (stock(state, recipeId) <= 0) return false;
  if (recipe.effect === "heal" && state.player.hp >= state.player.hpMax) return false;
  return true;
}

export function useCraftItem(state: NextEngineState, recipeId: string) {
  const recipe = recipeById(recipeId);
  if (!recipe || !canUseCraftItem(state, recipeId)) return false;
  const craft = normalizeCraft(state);
  craft.inventory[recipeId] = Math.max(0, (craft.inventory[recipeId] || 0) - 1);
  state.stats.craftUses = (state.stats.craftUses || 0) + 1;
  bumpQuestCounter(state, "craft");
  activateCraftEffect(state, recipe);
  persistCraft(state);
  syncCraftStats(state);
  return true;
}

export function canCraftRecipe(state: NextEngineState, recipeId: string) {
  return canUseCraftItem(state, recipeId) || canBuyCraftItem(state, recipeId);
}

export function applyCraftRecipe(state: NextEngineState, recipeId: string) {
  if (canUseCraftItem(state, recipeId)) return useCraftItem(state, recipeId);
  return buyCraftItem(state, recipeId, 1);
}

export function getCraftStock(state: NextEngineState, recipeId: string) {
  return stock(state, recipeId);
}

export function updateCraftSystem(state: NextEngineState, dt: number) {
  const craft = normalizeCraft(state);
  craft.barrierT = Math.max(0, craft.barrierT - dt);
  craft.biteBoostT = Math.max(0, craft.biteBoostT - dt);
  craft.sonarT = Math.max(0, craft.sonarT - dt);
  craft.overdriveT = Math.max(0, craft.overdriveT - dt);

  if (craft.barrierT > 0 && !state.player.downed && !state.player.dead) {
    state.player.invulnT = Math.max(state.player.invulnT, 0.18);
  }

  if (craft.overdriveT > 0 && !state.player.downed && !state.player.dead) {
    state.player.dashCd = Math.min(state.player.dashCd, 0.24);
    state.player.invulnT = Math.max(state.player.invulnT, 0.12);
  }

  syncCraftStats(state);
}
