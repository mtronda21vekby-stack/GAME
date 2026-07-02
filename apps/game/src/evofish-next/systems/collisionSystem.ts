import type { NextEngineState, NextFishEntity } from "../core/engineTypes";
import { makeEnemy } from "./createWorld";
import { awardKillProgression } from "./progressionSystem";

export function canDevour(attackerMass: number, targetMass: number) {
  return attackerMass >= targetMass * 1.08;
}

function addFloat(state: NextEngineState, x: number, y: number, text: string, kind: "damage" | "kill" | "danger") {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 0.75, kind });
}

function devourEnemy(state: NextEngineState, enemy: NextFishEntity, index: number) {
  const player = state.player;
  const massGain = enemy.mass * 0.08;
  const xp = awardKillProgression(state, enemy, "devour");

  player.mass += massGain;
  player.radius = Math.min(player.radius + enemy.radius * 0.018, 58);
  player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.08);
  state.stats.kills += 1;
  state.stats.lastEvent = `Поглощение +${xp} XP +${massGain.toFixed(2)} Mass`;
  addFloat(state, enemy.x, enemy.y, `EAT +${xp}XP`, "kill");
  state.enemies.splice(index, 1, makeEnemy(1000 + state.stats.kills, state.config));
}

function contactDamage(state: NextEngineState, enemy: NextFishEntity) {
  const player = state.player;
  if (player.invulnT > 0) return;

  const damage = Math.round(enemy.damage);
  player.hp = Math.max(0, player.hp - damage);
  player.hitT = 0.22;
  player.invulnT = 0.55;
  player.vx -= Math.cos(player.angle) * 80;
  player.vy -= Math.sin(player.angle) * 80;
  state.stats.lastEvent = `Урон -${damage}`;
  addFloat(state, player.x, player.y - player.radius * 2, `-${damage} HP`, "danger");
}

export function updateCollisionSystem(state: NextEngineState) {
  const player = state.player;

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);

    if (distance < player.radius + enemy.radius) {
      if (canDevour(player.mass, enemy.mass)) devourEnemy(state, enemy, index);
      else contactDamage(state, enemy);
    }
  }

  state.stats.mass = player.mass;
  state.stats.hp = player.hp;
  state.stats.hpMax = player.hpMax;
}
