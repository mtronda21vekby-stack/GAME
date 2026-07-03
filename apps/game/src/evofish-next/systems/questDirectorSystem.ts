import type { NextEngineState } from "../core/engineTypes";
import { makeResourceNode, type NextResourceKind } from "../content/resources";

const FOCUS_RESOURCE_KIND: Record<string, NextResourceKind[]> = {
  economy: ["pearls", "pearls", "plankton", "heal"],
  premium: ["coral", "coral", "pearls", "boost"],
  map: ["pearls", "coral", "plankton", "boost"],
  craft: ["pearls", "pearls", "coral", "heal"],
  mutation: ["coral", "coral", "pearls", "plankton"],
  combat: ["heal", "boost", "pearls", "plankton"],
  growth: ["plankton", "pearls", "heal", "boost"],
  evolution: ["plankton", "pearls", "coral", "boost"],
  balanced: ["pearls", "plankton", "heal", "coral", "boost"]
};

function focus(state: NextEngineState) {
  return state.quests.directorFocus || state.stats.questDirectorFocus || "balanced";
}

function preferredKinds(state: NextEngineState) {
  return FOCUS_RESOURCE_KIND[focus(state)] || FOCUS_RESOURCE_KIND.balanced;
}

function hasActiveKind(state: NextEngineState, kind: NextResourceKind) {
  return state.resources.some((node) => node.kind === kind && node.respawnT <= 0);
}

function replaceResource(state: NextEngineState, index: number, kind: NextResourceKind) {
  state.resources[index] = makeResourceNode(9000 + state.frame + index, state.config.width, state.config.height, kind);
}

function steerResourcePool(state: NextEngineState) {
  if (!state.resources.length) return;
  const kinds = preferredKinds(state);
  const required = kinds.slice(0, focus(state) === "premium" || focus(state) === "mutation" ? 3 : 2);

  for (const kind of required) {
    if (hasActiveKind(state, kind)) continue;
    const index = state.resources.findIndex((node) => node.respawnT > 0 || node.x < 0 || node.y < 0);
    if (index >= 0) replaceResource(state, index, kind);
  }

  if (state.frame % 480 !== 0) return;
  const kind = kinds[Math.floor((state.frame / 480) % kinds.length)] || "pearls";
  const candidates = state.resources
    .map((node, index) => ({ node, index }))
    .filter((item) => item.node.kind !== kind && item.node.respawnT <= 0);
  if (!candidates.length) return;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  replaceResource(state, pick.index, kind);
}

function steerCraftPressure(state: NextEngineState) {
  const currentFocus = focus(state);
  if (currentFocus !== "craft") return;
  if (state.craft.sonarT > 0 || state.frame % 600 !== 0) return;
  state.craft.sonarT = Math.max(state.craft.sonarT, 3.5);
  state.stats.lastEvent = "Quest Director: craft sonar window";
}

function steerMutationPressure(state: NextEngineState) {
  const currentFocus = focus(state);
  if (currentFocus !== "mutation" && currentFocus !== "premium") return;
  if (state.frame % 540 !== 0) return;
  const coralIndex = state.resources.findIndex((node) => node.kind !== "coral" && node.respawnT <= 0);
  if (coralIndex >= 0) replaceResource(state, coralIndex, "coral");
}

function steerCombatPressure(state: NextEngineState) {
  const currentFocus = focus(state);
  if (currentFocus !== "combat") return;
  if (state.frame % 360 !== 0) return;
  for (const enemy of state.enemies.slice(0, 4)) {
    if (enemy.aiType === "prey" || enemy.aiType === "neutral") {
      enemy.wanderX = state.player.x + (Math.random() - 0.5) * 720;
      enemy.wanderY = state.player.y + (Math.random() - 0.5) * 520;
      enemy.wanderT = Math.min(enemy.wanderT, 0.35);
    }
  }
}

export function updateQuestDirectorSystem(state: NextEngineState) {
  const currentFocus = focus(state);
  state.stats.questDirectorFocus = currentFocus;
  steerResourcePool(state);
  steerCraftPressure(state);
  steerMutationPressure(state);
  steerCombatPressure(state);
}
