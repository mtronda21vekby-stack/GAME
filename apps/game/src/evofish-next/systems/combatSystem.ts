import type { NextEngineState, NextFishEntity, NextInputState, NextCameraState } from "../core/engineTypes";
import { enemyThreatLevel, makeEnemy } from "./createWorld";
import { canDevour } from "./collisionSystem";
import { awardKillReward } from "./progressionSystem";

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.75, kind });
}

function rewardText(reward: { xp: number; pearls: number; corals: number }) {
  return `+${reward.xp} XP +${reward.pearls} жемчуг${reward.corals ? ` +${reward.corals} коралл` : ""}`;
}

function respawnEnemy(state: NextEngineState) {
  const threat = enemyThreatLevel(state.player.level, state.player.tier, state.player.mass);
  return makeEnemy(1000 + state.stats.kills + state.frame, state.config, threat, state.player.mass);
}

function killEnemy(state: NextEngineState, enemy: NextFishEntity, index: number, source: "bite" | "devour") {
  const player = state.player;
  const massGain = enemy.mass * (source === "devour" ? 0.055 : 0.032);
  const reward = awardKillReward(state, enemy, source);

  player.mass += massGain;
  player.radius = Math.min(player.radius + enemy.radius * 0.009, 58);
  player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.045);

  state.stats.kills += 1;
  state.stats.lastEvent = `Убийство ${rewardText(reward)} +${massGain.toFixed(2)} Mass`;
  addFloat(state, enemy.x, enemy.y, `KILL +${reward.xp}XP +${reward.pearls}P`, "kill");
  if (reward.corals) addFloat(state, enemy.x, enemy.y - enemy.radius * 2.5, `+${reward.corals} CORAL`, "kill");
  state.enemies.splice(index, 1, respawnEnemy(state));
}

function findBiteTarget(state: NextEngineState, camera: NextCameraState, input: NextInputState) {
  const player = state.player;
  const scale = camera.scale || 1;
  const aimX = input.down ? camera.x + input.pointerX / scale - player.x : Math.cos(player.angle);
  const aimY = input.down ? camera.y + input.pointerY / scale - player.y : Math.sin(player.angle);
  const aimLen = Math.hypot(aimX, aimY) || 1;
  const nx = aimX / aimLen;
  const ny = aimY / aimLen;
  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const range = player.radius * 2.45 + enemy.radius;
    if (distance > range) continue;
    const dot = (dx / (distance || 1)) * nx + (dy / (distance || 1)) * ny;
    if (dot < 0.25) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function updateCombatSystem(state: NextEngineState, input: NextInputState, camera: NextCameraState) {
  const player = state.player;

  if (!input.bite) return;
  input.bite = false;

  if (player.biteCd > 0) return;
  player.biteCd = state.craft.biteBoostT > 0 ? 0.25 : 0.34;

  const targetIndex = findBiteTarget(state, camera, input);
  if (targetIndex < 0) {
    state.stats.lastEvent = "Укус мимо";
    addFloat(state, player.x + Math.cos(player.angle) * player.radius * 1.7, player.y + Math.sin(player.angle) * player.radius * 1.7, "MISS", "danger");
    return;
  }

  const enemy = state.enemies[targetIndex];
  const craftBoost = state.craft.biteBoostT > 0 ? 1.35 : 1;
  const damage = Math.round(player.damage * (player.dashT > 0 ? 1.35 : 1) * craftBoost);
  enemy.hp -= damage;
  enemy.hitT = 0.18;
  enemy.vx += Math.cos(player.angle) * 120;
  enemy.vy += Math.sin(player.angle) * 120;
  state.stats.lastEvent = state.craft.biteBoostT > 0 ? `Укус BOOST -${damage}` : `Укус -${damage}`;
  addFloat(state, enemy.x, enemy.y - enemy.radius * 1.8, `-${damage}`, "damage");

  if (enemy.hp <= 0 || canDevour(player.mass, enemy.mass)) {
    killEnemy(state, enemy, targetIndex, "bite");
  }
}

export function devourEnemyOnContact(state: NextEngineState, enemy: NextFishEntity, index: number) {
  killEnemy(state, enemy, index, "devour");
}
