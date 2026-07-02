import type { NextEngineState } from "../core/engineTypes";

export function updateFeedbackSystem(state: NextEngineState, dt: number) {
  for (const enemy of state.enemies) enemy.hitT = Math.max(0, enemy.hitT - dt);
  state.player.hitT = Math.max(0, state.player.hitT - dt);

  for (const float of state.floats) {
    float.ttl -= dt;
    float.y -= 34 * dt;
  }

  state.floats = state.floats.filter((float) => float.ttl > 0);
}
