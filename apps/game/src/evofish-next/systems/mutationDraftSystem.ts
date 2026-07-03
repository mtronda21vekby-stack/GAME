import type { NextEngineState } from "../core/engineTypes";
import { getMutationLevel, NEXT_MUTATIONS } from "../content/mutations";
import { refreshMutationStats } from "./progressionSystem";

function addFloat(state: NextEngineState, text: string) {
  state.floats.push({
    id: state.nextFloatId++,
    x: state.player.x,
    y: state.player.y - state.player.radius * 3.2,
    text,
    ttl: 1.1,
    kind: "kill"
  });
}

function counter(state: NextEngineState, key: string) {
  return Math.max(0, Math.floor(state.quests.counters?.[key] || 0));
}

function setCounter(state: NextEngineState, key: string, value: number) {
  state.quests.counters = state.quests.counters || {};
  state.quests.counters[key] = Math.max(0, Math.floor(value));
}

function bumpCounter(state: NextEngineState, key: string, amount = 1) {
  setCounter(state, key, counter(state, key) + amount);
}

function eligibleMutationIds(state: NextEngineState) {
  return NEXT_MUTATIONS
    .filter((mutation) => getMutationLevel(state.mutations, mutation.id) < mutation.maxLevel)
    .map((mutation) => mutation.id);
}

function pickOptions(state: NextEngineState) {
  const eligible = eligibleMutationIds(state);
  const seeded = [...eligible].sort((a, b) => {
    const ax = Math.sin((state.frame + state.player.level * 17 + a.length * 31) * 0.017) + Math.random() * 0.1;
    const bx = Math.sin((state.frame + state.player.level * 17 + b.length * 31) * 0.017) + Math.random() * 0.1;
    return bx - ax;
  });
  return seeded.slice(0, 3);
}

export function updateMutationDraftSystem(state: NextEngineState) {
  if (state.mutationDraft) {
    state.stats.mutationDraftReady = true;
    return;
  }

  const lastDraftLevel = counter(state, "mutationDraftLevel");
  const shouldDraftByLevel = state.player.level >= 4 && state.player.level >= lastDraftLevel + 4;
  const lastDraftTier = counter(state, "mutationDraftTier");
  const shouldDraftByTier = state.player.tier >= 3 && state.player.tier >= lastDraftTier + 3;

  if (!shouldDraftByLevel && !shouldDraftByTier) {
    state.stats.mutationDraftReady = false;
    return;
  }

  const options = pickOptions(state);
  if (!options.length) {
    state.stats.mutationDraftReady = false;
    return;
  }

  state.mutationDraft = {
    id: state.frame + state.player.level * 1000 + state.player.tier * 100,
    source: shouldDraftByLevel ? "level" : "tier",
    options,
    createdFrame: state.frame
  };
  state.stats.mutationDraftReady = true;
  state.stats.lastEvent = "Мутация: выбери 1 из 3";
}

export function applyMutationDraftChoice(state: NextEngineState, mutationId: string) {
  const draft = state.mutationDraft;
  if (!draft || !draft.options.includes(mutationId)) return false;

  const mutation = NEXT_MUTATIONS.find((item) => item.id === mutationId);
  if (!mutation) return false;

  const current = getMutationLevel(state.mutations, mutationId);
  if (current >= mutation.maxLevel) return false;

  state.mutations.levels[mutationId] = Math.min(mutation.maxLevel, current + 1);
  setCounter(state, "mutationDraftLevel", state.player.level);
  setCounter(state, "mutationDraftTier", state.player.tier);
  bumpCounter(state, "mutations");
  state.mutationDraft = null;
  state.stats.mutationDraftReady = false;
  state.stats.mutationPurchases = counter(state, "mutations");
  state.stats.lastEvent = `Мутация выбрана: ${mutation.name} LV ${current + 1}/${mutation.maxLevel}`;
  addFloat(state, `MUTATION: ${mutation.name}`);
  refreshMutationStats(state);
  return true;
}
