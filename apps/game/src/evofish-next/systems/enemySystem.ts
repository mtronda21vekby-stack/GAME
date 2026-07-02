import type { NextEngineState } from "../core/engineTypes";

export function updateEnemySystem(state: NextEngineState, dt: number) {
  for (const enemy of state.enemies) {
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.x < 80 || enemy.x > state.config.width - 80) enemy.vx *= -1;
    if (enemy.y < 80 || enemy.y > state.config.height - 80) enemy.vy *= -1;

    enemy.angle = Math.atan2(enemy.vy, enemy.vx);
  }
}
