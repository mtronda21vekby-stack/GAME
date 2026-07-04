import type { NextEngineState } from "../core/engineTypes";
import { getWorldMap } from "../content/worldMaps";
import { getZoneAt } from "../content/zones";

function addZoneFloat(state: NextEngineState, text: string) {
  const player = state.player;
  state.floats.push({ id: state.nextFloatId++, x: player.x, y: player.y - player.radius * 2.7, text, ttl: 0.95, kind: "danger" });
}

export function syncZoneStats(state: NextEngineState) {
  const zone = getZoneAt(state.player.x, state.player.y, state.worldId || "main_reef");
  const world = getWorldMap(state.worldId || "main_reef");
  state.stats.worldName = world.name;
  state.stats.zoneId = zone.id;
  state.stats.zoneName = zone.name;
  state.stats.zoneEffect = zone.description;
  state.stats.zoneRisk = zone.risk;
  state.stats.zoneRewardBoost = zone.rewardMultiplier;
  state.stats.storyTitle = state.story?.currentTitle || state.stats.storyTitle;
  state.stats.storyObjective = state.story?.currentObjective || state.stats.storyObjective;
  return zone;
}

export function updateZoneSystem(state: NextEngineState, dt: number) {
  const player = state.player;
  const zone = syncZoneStats(state);

  if (player.downed || player.dead || state.portalTransition?.active) return;

  if (zone.driftX || zone.driftY) {
    player.vx += (zone.driftX || 0) * dt;
    player.vy += (zone.driftY || 0) * dt;
  }

  if (zone.healPerSecond && player.hp < player.hpMax) {
    player.hp = Math.min(player.hpMax, player.hp + zone.healPerSecond * dt);
  }

  if (zone.pressureDamagePerSecond && state.craft.barrierT <= 0 && player.invulnT <= 0) {
    player.hp = Math.max(0, player.hp - zone.pressureDamagePerSecond * dt);
    if (state.frame % 70 === 0) addZoneFloat(state, state.worldId === "dark_cave" ? "NEON PRESSURE" : "PRESSURE");
  }

  if (zone.id !== "open_water" && state.frame % 210 === 0) {
    state.stats.lastEvent = `${worldNamePrefix(state)}${zone.name}`;
  }
}

function worldNamePrefix(state: NextEngineState) {
  return state.worldId === "dark_cave" ? "Dark Cave: " : "Zone: ";
}
