import type { NextEngineState } from "../core/engineTypes";
import type { NextMapEventState } from "../content/events";
import { makeNextMapEvent } from "../content/events";
import { makeResourceNode, type NextResourceKind } from "../content/resources";
import { awardNextXp } from "./progressionSystem";

function randomInCircle(x: number, y: number, radius: number) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius;
  return {
    x: x + Math.cos(angle) * distance,
    y: y + Math.sin(angle) * distance
  };
}

function addFloat(state: NextEngineState, event: NextMapEventState, text: string) {
  state.floats.push({ id: state.nextFloatId++, x: event.x, y: event.y - event.radius * 0.45, text, ttl: 1.1, kind: "kill" });
}

function activeEvent(state: NextEngineState) {
  if (!state.events || state.events.length === 0) {
    state.events = [makeNextMapEvent(1, state.config.width, state.config.height, state.player.level)];
    state.events[0].lastKills = state.stats.kills;
    state.events[0].lastResources = state.stats.resourcesCollected || 0;
    state.stats.lastEvent = `Event: ${state.events[0].name}`;
  }

  return state.events[0];
}

function spawnNextEvent(state: NextEngineState, previous?: NextMapEventState) {
  const nextId = (previous?.id || 0) + 1;
  const next = makeNextMapEvent(nextId, state.config.width, state.config.height, state.player.level);
  next.lastKills = state.stats.kills;
  next.lastResources = state.stats.resourcesCollected || 0;
  state.events = [next];
  state.stats.lastEvent = `Event: ${next.name}`;
  addFloat(state, next, "NEW EVENT");
  return next;
}

function completeEvent(state: NextEngineState, event: NextMapEventState) {
  const xp = awardNextXp(state, event.rewardXp);
  state.economy.pearls += event.rewardPearls;
  state.economy.corals += event.rewardCorals;
  state.stats.lastEvent = `${event.name} complete: +${xp} XP +${event.rewardPearls} жемчуг${event.rewardCorals ? ` +${event.rewardCorals} коралл` : ""}`;
  addFloat(state, event, `EVENT +${xp}XP +${event.rewardPearls}P`);
  spawnNextEvent(state, event);
}

function syncEventHud(state: NextEngineState, event: NextMapEventState) {
  state.stats.activeEventTitle = event.name;
  state.stats.activeEventKind = event.kind;
  state.stats.activeEventProgress = event.progress;
  state.stats.activeEventTarget = event.target;
  state.stats.activeEventTime = event.ttl;

  state.stats.activeQuestTitle = `${event.name} · ${Math.ceil(event.ttl)}s`;
  state.stats.activeQuestProgress = event.progress;
  state.stats.activeQuestTarget = event.target;
}

function pulseResourceBloom(state: NextEngineState, event: NextMapEventState) {
  const forced: NextResourceKind[] = ["pearls", "plankton", "heal", "coral"];
  const index = (event.id + Math.floor(event.tick * 10)) % Math.max(1, state.resources.length);
  const kind = forced[(event.id + state.frame + index) % forced.length];
  const point = randomInCircle(event.x, event.y, event.radius * 0.72);
  const node = makeResourceNode(9000 + state.frame + index, state.config.width, state.config.height, kind);
  node.x = Math.max(80, Math.min(state.config.width - 80, point.x));
  node.y = Math.max(80, Math.min(state.config.height - 80, point.y));
  state.resources[index] = node;
}

function updateResourceBloom(state: NextEngineState, event: NextMapEventState, inside: boolean, dt: number) {
  event.tick += dt;
  if (event.tick >= 1.35) {
    event.tick = 0;
    pulseResourceBloom(state, event);
  }

  const collected = state.stats.resourcesCollected || 0;
  if (inside && collected > event.lastResources) {
    event.progress += collected - event.lastResources;
  }
  event.lastResources = collected;
}

function updateSafeSpring(state: NextEngineState, event: NextMapEventState, inside: boolean, dt: number) {
  event.tick += dt;
  if (!inside || state.player.downed || state.player.dead) return;

  event.progress += dt;
  state.player.hp = Math.min(state.player.hpMax, state.player.hp + state.player.hpMax * 0.055 * dt);

  if (event.tick >= 1) {
    event.tick = 0;
    addFloat(state, event, "SPRING HEAL");
  }
}

function updateHuntPack(state: NextEngineState, event: NextMapEventState, inside: boolean, dt: number) {
  event.tick += dt;

  if (event.tick >= 1.2) {
    event.tick = 0;
    for (const enemy of state.enemies.slice(0, 8)) {
      if (enemy.aiType === "apex" || enemy.aiType === "leviathan") continue;
      const point = randomInCircle(event.x, event.y, event.radius * 0.75);
      enemy.wanderX = point.x;
      enemy.wanderY = point.y;
      enemy.wanderT = Math.min(enemy.wanderT, 0.35);
    }
  }

  const kills = state.stats.kills;
  if (inside && kills > event.lastKills) {
    event.progress += kills - event.lastKills;
  }
  event.lastKills = kills;
}

export function updateEventSystem(state: NextEngineState, dt: number) {
  const event = activeEvent(state);
  event.ttl = Math.max(0, event.ttl - dt);

  const distance = Math.hypot(state.player.x - event.x, state.player.y - event.y);
  const inside = distance <= event.radius;

  if (event.kind === "resource_bloom") updateResourceBloom(state, event, inside, dt);
  if (event.kind === "safe_spring") updateSafeSpring(state, event, inside, dt);
  if (event.kind === "hunt_pack") updateHuntPack(state, event, inside, dt);

  if (event.progress >= event.target) {
    completeEvent(state, event);
    return;
  }

  if (event.ttl <= 0) {
    state.stats.lastEvent = `${event.name} expired`;
    spawnNextEvent(state, event);
    return;
  }

  syncEventHud(state, event);
}
