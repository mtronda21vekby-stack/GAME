import type { NextEngineState } from "../core/engineTypes";
import { makeEnemy } from "./createWorld";

export function canDevour(attackerMass: number, targetMass: number) {
  return attackerMass >= targetMass * 1.08;
}

export function updateCollisionSystem(state: NextEngineState) {
  const player = state.player;

  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);

    if (distance < player.radius + enemy.radius && canDevour(player.mass, enemy.mass)) {
      player.mass += enemy.mass * 0.08;
      player.radius = Math.min(player.radius + enemy.radius * 0.018, 58);
      state.stats.kills += 1;
      state.enemies.splice(index, 1, makeEnemy(1000 + state.stats.kills, state.config));
    }
  }

  state.stats.mass = player.mass;
}
