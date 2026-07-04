import type { NextEngineState, NextPortalTransitionState } from "../core/engineTypes";
import { DARK_CAVE_STORY_TITLE, darkCaveStoryStep } from "../content/darkCaveStory";
import { createResourceField } from "../content/resources";
import { getWorldMap, type EvoFishWorldId } from "../content/worldMaps";
import { darkCavePortalPosition, darkCavePortalRequirementText, darkCavePortalUnlocked, oceanReturnPortalPosition } from "../assets/visuals/visualCatalog";

const PORTAL_LOAD_SECONDS = 2.35;
const PORTAL_TRIGGER_PADDING = 34;

function addPortalFloat(state: NextEngineState, text: string) {
  state.floats.push({ id: state.nextFloatId++, x: state.player.x, y: state.player.y - state.player.radius * 3, text, ttl: 1.2, kind: "kill" });
}

function distanceToPlayer(state: NextEngineState, x: number, y: number) {
  return Math.hypot(state.player.x - x, state.player.y - y);
}

function randomizeWorldPopulation(state: NextEngineState) {
  for (const enemy of state.enemies) {
    enemy.x = 180 + Math.random() * (state.config.width - 360);
    enemy.y = 180 + Math.random() * (state.config.height - 360);
    enemy.vx = -35 + Math.random() * 70;
    enemy.vy = -35 + Math.random() * 70;
    enemy.aiState = "wander";
    enemy.wanderX = 180 + Math.random() * (state.config.width - 360);
    enemy.wanderY = 180 + Math.random() * (state.config.height - 360);
    enemy.wanderT = 0.6 + Math.random() * 2.2;
  }

  state.resources = createResourceField(state.config.resourceTarget, state.config.width, state.config.height);
}

function syncStory(state: NextEngineState) {
  const artifacts = state.stats.artifactsFound || 0;
  const inDarkCave = state.worldId === "dark_cave";
  const step = darkCaveStoryStep(artifacts, inDarkCave, state.player.level);
  state.story = state.story || { darkCaveUnlocked: false, darkCaveEntered: false, currentTitle: step.title, currentObjective: step.objective, completed: {} };
  state.story.darkCaveUnlocked = darkCavePortalUnlocked(artifacts, state.player.level);
  state.story.currentTitle = step.title;
  state.story.currentObjective = step.objective;
  state.stats.storyTitle = DARK_CAVE_STORY_TITLE;
  state.stats.storyObjective = step.objective;
  state.stats.worldName = getWorldMap(state.worldId).name;
}

function startPortalTransition(state: NextEngineState, toWorld: EvoFishWorldId) {
  if (state.portalTransition?.active) return;
  const fromWorld = state.worldId;
  const direction: NextPortalTransitionState["direction"] = toWorld === "dark_cave" ? "to_dark_cave" : "to_main";
  state.portalTransition = {
    active: true,
    fromWorld,
    toWorld,
    direction,
    progress: 0,
    message: toWorld === "dark_cave" ? "Загрузка тёмной пещеры" : "Возвращение в основной океан"
  };
  state.player.vx *= 0.25;
  state.player.vy *= 0.25;
  state.player.invulnT = Math.max(state.player.invulnT, PORTAL_LOAD_SECONDS + 0.5);
  state.stats.portalLoading = 0;
  state.stats.lastEvent = state.portalTransition.message;
  addPortalFloat(state, toWorld === "dark_cave" ? "PORTAL OPEN" : "RETURN PORTAL");
}

function completePortalTransition(state: NextEngineState) {
  const transition = state.portalTransition;
  if (!transition) return;

  state.worldId = transition.toWorld;
  state.config = getWorldMap(transition.toWorld).config;
  state.portalTransition = null;
  state.stats.portalLoading = 0;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.invulnT = Math.max(state.player.invulnT, 2.2);

  if (transition.toWorld === "dark_cave") {
    const entry = oceanReturnPortalPosition(state.config);
    state.player.x = Math.min(state.config.width - 180, entry.x + 180);
    state.player.y = entry.y;
    state.story.darkCaveEntered = true;
    state.story.completed.enter_cave = true;
    state.stats.lastEvent = "Ты вошёл в тёмную неоновую пещеру";
  } else {
    const exit = darkCavePortalPosition(state.config);
    state.player.x = Math.max(180, exit.x - 180);
    state.player.y = exit.y;
    state.story.completed.return_ocean = true;
    state.stats.lastEvent = "Ты вернулся в основной океан";
  }

  randomizeWorldPopulation(state);
  syncStory(state);
  addPortalFloat(state, transition.toWorld === "dark_cave" ? "DARK CAVE" : "OCEAN");
}

function updateActiveTransition(state: NextEngineState, dt: number) {
  const transition = state.portalTransition;
  if (!transition?.active) return false;

  state.player.vx *= 0.86;
  state.player.vy *= 0.86;
  transition.progress = Math.min(1, transition.progress + dt / PORTAL_LOAD_SECONDS);
  state.stats.portalLoading = transition.progress;
  state.stats.lastEvent = `${transition.message}: ${Math.round(transition.progress * 100)}%`;

  if (transition.progress >= 1) completePortalTransition(state);
  return true;
}

export function updatePortalSystem(state: NextEngineState, dt: number) {
  syncStory(state);
  if (updateActiveTransition(state, dt)) return true;
  if (state.player.downed || state.player.dead) return false;

  if (state.worldId === "main_reef") {
    const artifacts = state.stats.artifactsFound || 0;
    const portal = darkCavePortalPosition(state.config);
    const nearPortal = distanceToPlayer(state, portal.x, portal.y) <= state.player.radius + portal.radius + PORTAL_TRIGGER_PADDING;
    if (!nearPortal) return false;
    if (!darkCavePortalUnlocked(artifacts, state.player.level)) {
      if (state.frame % 50 === 0) {
        state.stats.lastEvent = `Портал закрыт: ${darkCavePortalRequirementText(artifacts, state.player.level)}`;
        addPortalFloat(state, darkCavePortalRequirementText(artifacts, state.player.level));
      }
      return false;
    }
    startPortalTransition(state, "dark_cave");
    return true;
  }

  if (state.worldId === "dark_cave") {
    const portal = oceanReturnPortalPosition(state.config);
    if (distanceToPlayer(state, portal.x, portal.y) <= state.player.radius + portal.radius + PORTAL_TRIGGER_PADDING) {
      startPortalTransition(state, "main_reef");
      return true;
    }
  }

  return false;
}
