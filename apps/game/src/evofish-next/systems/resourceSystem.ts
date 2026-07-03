import type { NextEngineState } from "../core/engineTypes";
import { makeResourceNode, resourceDef, resourceRespawnDelay } from "../content/resources";
import { getMutationBonus } from "../content/mutations";
import { awardNextXp } from "./progressionSystem";

function addFloat(state: NextEngineState, text: string, x = state.player.x, y = state.player.y) {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.9, kind: "kill" });
}

function pickupAmount(state: NextEngineState, value: number, premium = false) {
  const bonus = 1 + getMutationBonus(state.mutations, "reward") * (premium ? 0.55 : 0.42);
  return Math.max(1, Math.round(value * bonus));
}

function bumpQuestCounter(state: NextEngineState, key: string, amount = 1) {
  state.quests.counters = state.quests.counters || {};
  state.quests.counters[key] = Math.max(0, Math.floor((state.quests.counters[key] || 0) + amount));
}

function collectPerk(state: NextEngineState, nodeKind: string, duration: number, x: number, y: number) {
  bumpQuestCounter(state, "perks");
  state.stats.perksPicked = Math.max(state.stats.perksPicked || 0, state.quests.counters?.perks || 0);

  if (nodeKind === "speed_perk") {
    state.player.vx += Math.cos(state.player.angle) * state.player.speed * 0.65;
    state.player.vy += Math.sin(state.player.angle) * state.player.speed * 0.65;
    state.player.dashCd = Math.min(state.player.dashCd, 0.25);
    state.craft.sonarT = Math.max(state.craft.sonarT, duration * 0.55);
    state.stats.lastEvent = `SPD Перк: рывок + sonar ${Math.round(duration * 0.55)}с`;
    addFloat(state, "SPD PERK", x, y);
  }

  if (nodeKind === "damage_perk") {
    state.craft.biteBoostT = Math.max(state.craft.biteBoostT, duration);
    state.stats.lastEvent = `DMG Перк: bite boost ${duration}с`;
    addFloat(state, "DMG PERK", x, y);
  }

  if (nodeKind === "shield_perk") {
    state.craft.barrierT = Math.max(state.craft.barrierT, duration);
    state.player.invulnT = Math.max(state.player.invulnT, 0.75);
    state.stats.lastEvent = `SHD Перк: barrier ${duration}с`;
    addFloat(state, "SHIELD PERK", x, y);
  }
}

function collectArtifact(state: NextEngineState, x: number, y: number) {
  bumpQuestCounter(state, "artifacts");
  state.stats.artifactsFound = Math.max(state.stats.artifactsFound || 0, state.quests.counters?.artifacts || 0);

  const xp = awardNextXp(state, 420 + state.player.level * 12);
  const pearls = pickupAmount(state, 180 + state.player.tier * 14);
  const corals = 1;
  state.economy.pearls += pearls;
  state.economy.corals += corals;
  state.craft.sonarT = Math.max(state.craft.sonarT, 14);
  state.stats.lastEvent = `Древняя раковина: +${xp} XP +${pearls} жемчуг +${corals} кристалл`;
  addFloat(state, "ARTIFACT SHELL", x, y);
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

  if (node.kind === "speed_perk" || node.kind === "damage_perk" || node.kind === "shield_perk") {
    collectPerk(state, node.kind, node.value, node.x, node.y);
  }

  if (node.kind === "artifact_shell") {
    collectArtifact(state, node.x, node.y);
  }

  state.stats.resourcesCollected = (state.stats.resourcesCollected || 0) + 1;
  bumpQuestCounter(state, "resources");
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
