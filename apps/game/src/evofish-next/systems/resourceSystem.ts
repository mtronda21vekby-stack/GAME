import type { NextEngineState } from "../core/engineTypes";
import { makeResourceNode, resourceDef, resourceRespawnDelay } from "../content/resources";
import { getMutationBonus } from "../content/mutations";
import { awardNextXp } from "./progressionSystem";

function addFloat(state: NextEngineState, text: string, x = state.player.x, y = state.player.y) {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.82, kind: "kill" });
}

function pickupAmount(state: NextEngineState, value: number, premium = false) {
  const bonus = 1 + getMutationBonus(state.mutations, "reward") * (premium ? 0.75 : 0.55);
  return Math.max(1, Math.round(value * bonus));
}

function collectResource(state: NextEngineState, index: number) {
  const node = state.resources[index];
  const def = resourceDef(node.kind);

  if (node.kind === "pearls") {
    const amount = pickupAmount(state, node.value);
    state.economy.pearls += amount;
    state.stats.lastEvent = `${def.name}: +${amount} жемчуг`;
    addFloat(state, `🦪 +${amount}`, node.x, node.y);
  }

  if (node.kind === "coral") {
    const amount = pickupAmount(state, node.value, true);
    state.economy.corals += amount;
    state.stats.lastEvent = `${def.name}: +${amount} кристалл`;
    addFloat(state, `💎 +${amount}`, node.x, node.y);
  }

  if (node.kind === "plankton") {
    const xp = awardNextXp(state, node.value);
    state.stats.lastEvent = `${def.name}: +${xp} XP`;
    addFloat(state, `+${xp} XP`, node.x, node.y);
  }

  if (node.kind === "heal") {
    const heal = Math.round(state.player.hpMax * (node.value / 100));
    state.player.hp = Math.min(state.player.hpMax, state.player.hp + heal);
    state.stats.lastEvent = `${def.name}: +${heal} HP`;
    addFloat(state, `+${heal} HP`, node.x, node.y);
  }

  if (node.kind === "boost") {
    state.craft.sonarT = Math.max(state.craft.sonarT, 7);
    state.player.invulnT = Math.max(state.player.invulnT, 0.55);
    state.stats.lastEvent = `${def.name}: sonar + shield`;
    addFloat(state, "SPARK", node.x, node.y);
  }

  state.stats.resourcesCollected = (state.stats.resourcesCollected || 0) + 1;
  state.resources[index] = {
    ...node,
    respawnT: resourceRespawnDelay(node.kind),
    x: -9999,
    y: -9999
  };
}

export function updateResourceSystem(state: NextEngineState, dt: number) {
  const player = state.player;
  let active = 0;

  for (let index = 0; index < state.resources.length; index += 1) {
    const node = state.resources[index];
    node.pulse += dt * 2.2;

    if (node.respawnT > 0) {
      node.respawnT = Math.max(0, node.respawnT - dt);
      if (node.respawnT <= 0) {
        state.resources[index] = makeResourceNode(5000 + state.frame + index, state.config.width, state.config.height, node.kind);
      }
      continue;
    }

    active += 1;
    if (player.downed || player.dead) continue;

    const distance = Math.hypot(node.x - player.x, node.y - player.y);
    if (distance <= player.radius + node.radius + 12) collectResource(state, index);
  }

  state.stats.activeResources = active;
}
