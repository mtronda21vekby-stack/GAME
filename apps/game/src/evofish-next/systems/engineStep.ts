import type { NextEngineState, NextInputState, NextViewport } from "../core/engineTypes";
import { getNextCamera } from "./cameraSystem";
import { updateCollisionSystem } from "./collisionSystem";
import { updateEnemySystem } from "./enemySystem";
import { updatePlayerSystem } from "./playerSystem";

export function stepNextEngine(state: NextEngineState, input: NextInputState, viewport: NextViewport, dt: number) {
  const camera = getNextCamera(state, viewport);

  updatePlayerSystem(state, input, camera, dt);
  updateEnemySystem(state, dt);
  updateCollisionSystem(state);

  state.frame += 1;
  state.stats.mass = state.player.mass;
  state.stats.skinName = state.player.skin.name;

  return state;
}
