import type { NextEngineState } from "../core/engineTypes";

const REVIVE_DELAY = 2.4;
const REVIVE_INVULN = 2.2;

function addFloat(state: NextEngineState, x: number, y: number, text: string) {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 1.1, kind: "danger" });
}

function startDowned(state: NextEngineState) {
  const player = state.player;
  if (player.downed) return;

  player.downed = true;
  player.dead = true;
  player.downT = 0;
  player.deathT = 0;
  player.reviveT = REVIVE_DELAY;
  player.respawnT = REVIVE_DELAY;
  player.hp = 0;
  player.vx = 0;
  player.vy = 0;
  player.biteCd = 0;
  player.dashCd = 0;
  player.dashT = 0;

  state.stats.downs = (state.stats.downs || state.stats.deaths || 0) + 1;
  state.stats.deaths = state.stats.downs;
  state.stats.downed = true;
  state.stats.dead = true;
  state.stats.reviveTime = REVIVE_DELAY;
  state.stats.respawnTime = REVIVE_DELAY;
  state.stats.lastEvent = "Ты упал. Возрождение...";
  addFloat(state, player.x, player.y - player.radius * 2.8, "DOWNED");
}

function revive(state: NextEngineState) {
  const player = state.player;
  const safeX = state.config.width / 2;
  const safeY = state.config.height / 2;

  player.downed = false;
  player.dead = false;
  player.downT = 0;
  player.deathT = 0;
  player.reviveT = 0;
  player.respawnT = 0;
  player.x = safeX;
  player.y = safeY;
  player.vx = 0;
  player.vy = 0;
  player.hp = Math.max(1, Math.floor(player.hpMax * 0.68));
  player.invulnT = REVIVE_INVULN;
  player.mass = Math.max(1, player.mass * 0.94);

  state.stats.downed = false;
  state.stats.dead = false;
  state.stats.reviveTime = 0;
  state.stats.respawnTime = 0;
  state.stats.hp = player.hp;
  state.stats.mass = player.mass;
  state.stats.lastEvent = "Возрождение: щит 2 сек";
  addFloat(state, player.x, player.y - player.radius * 2.8, "REVIVE");
}

export function updateSurvivalSystem(state: NextEngineState, dt: number) {
  const player = state.player;

  if (!player.downed && player.hp <= 0) startDowned(state);

  if (player.downed) {
    player.downT = (player.downT || 0) + dt;
    player.deathT = player.downT;
    player.reviveT = Math.max(0, (player.reviveT || REVIVE_DELAY) - dt);
    player.respawnT = player.reviveT;
    state.stats.downed = true;
    state.stats.dead = true;
    state.stats.reviveTime = player.reviveT;
    state.stats.respawnTime = player.reviveT;
    state.stats.hp = 0;
    if (player.reviveT <= 0) revive(state);
  }
}
