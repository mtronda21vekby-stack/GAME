import type { EvoFishFormId } from "../core/types";
import type { NextEngineState } from "../core/engineTypes";
import { awardNextAccountRun, calculateRunAccountXp } from "../content/account";
import { getMutationBonus } from "../content/mutations";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { damageFromForm, enemyThreatLevel, hpFromForm, makeEnemy, massFromForm, radiusFromForm, safePlayerSpawn, speedFromForm } from "./createWorld";

const REVIVE_DELAY = 2.4;
const REVIVE_INVULN = 4.5;
const RESET_FORM: EvoFishFormId = "fish";

function addFloat(state: NextEngineState, x: number, y: number, text: string) {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 1.1, kind: "danger" });
}

function syncAccountStats(state: NextEngineState) {
  state.stats.accountName = state.account.name;
  state.stats.accountLevel = state.account.level;
  state.stats.accountXp = state.account.xp;
  state.stats.accountXpToNext = state.account.xpToNext;
  state.stats.lastRunAccountXp = state.account.lastRunXp;
}

function awardRunToAccount(state: NextEngineState) {
  const player = state.player;
  const runXp = calculateRunAccountXp({
    kills: state.stats.kills,
    mass: player.mass,
    level: player.level,
    tier: player.tier,
    zoneRisk: state.stats.zoneRisk
  });

  state.account = awardNextAccountRun(state.account, {
    xp: runXp,
    kills: state.stats.kills,
    mass: player.mass
  });

  syncAccountStats(state);
  return runXp;
}

function resetFishRun(state: NextEngineState) {
  const player = state.player;
  const hpBonus = getMutationBonus(state.mutations, "hp");
  const damageBonus = getMutationBonus(state.mutations, "damage");
  const speedBonus = getMutationBonus(state.mutations, "speed");
  const hpMax = Math.round(hpFromForm(RESET_FORM) * (1 + hpBonus));

  player.form = RESET_FORM;
  player.mass = massFromForm(RESET_FORM);
  player.radius = radiusFromForm(RESET_FORM);
  player.hpMax = hpMax;
  player.hp = hpMax;
  player.damage = Math.round(damageFromForm(RESET_FORM) * (1 + damageBonus));
  player.speed = speedFromForm(RESET_FORM) * (1 + speedBonus);
  player.level = 1;
  player.tier = 1;
  player.xp = 0;
  player.xpToNext = xpToNextTier(1);
  player.levelXp = 0;
  player.levelXpToNext = xpToNextLevel(1);
  player.hitT = 0;
  player.biteCd = 0;
  player.dashCd = 0;
  player.dashT = 0;

  state.stats.kills = 0;
  state.stats.deaths = 0;
  state.stats.downs = 0;
  state.stats.mass = player.mass;
  state.stats.hp = player.hp;
  state.stats.hpMax = player.hpMax;
  state.stats.level = player.level;
  state.stats.tier = player.tier;
  state.stats.xp = player.xp;
  state.stats.xpToNext = player.xpToNext;
  state.stats.levelXp = player.levelXp;
  state.stats.levelXpToNext = player.levelXpToNext;
  state.stats.formName = "Рыба";
}

function startDowned(state: NextEngineState) {
  const player = state.player;
  if (player.downed) return;

  const runXp = awardRunToAccount(state);

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
  state.stats.lastEvent = `Run ended: +${runXp} account XP`;
  addFloat(state, player.x, player.y - player.radius * 2.8, `ACCOUNT +${runXp} XP`);
}

function clearSpawnDanger(state: NextEngineState) {
  const player = state.player;
  const threat = enemyThreatLevel(player.level, player.tier, player.mass);

  for (let index = 0; index < state.enemies.length; index += 1) {
    const enemy = state.enemies[index];
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (distance < 820 || enemy.aiType === "apex" || enemy.aiType === "leviathan") {
      state.enemies[index] = makeEnemy(8000 + state.frame + index, state.config, threat, player.mass, player.x, player.y, 920);
    }
  }
}

function revive(state: NextEngineState) {
  const player = state.player;
  const spawn = safePlayerSpawn(state.config, state.enemies);

  player.downed = false;
  player.dead = false;
  player.downT = 0;
  player.deathT = 0;
  player.reviveT = 0;
  player.respawnT = 0;
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  resetFishRun(state);
  player.invulnT = REVIVE_INVULN;
  clearSpawnDanger(state);

  state.stats.downed = false;
  state.stats.dead = false;
  state.stats.reviveTime = 0;
  state.stats.respawnTime = 0;
  state.stats.lastEvent = `Safe respawn · Account LV ${state.account.level}`;
  addFloat(state, player.x, player.y - player.radius * 2.8, "SAFE SPAWN");
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
