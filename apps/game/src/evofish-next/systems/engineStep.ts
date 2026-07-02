import type { NextEngineState, NextInputState, NextViewport } from "../core/engineTypes";
import { getNextCamera } from "./cameraSystem";
import { updateCollisionSystem } from "./collisionSystem";
import { updateCombatSystem } from "./combatSystem";
import { updateEnemySystem } from "./enemySystem";
import { updateFeedbackSystem } from "./feedbackSystem";
import { updatePlayerSystem } from "./playerSystem";

export function stepNextEngine(state: NextEngineState, input: NextInputState, viewport: NextViewport, dt: number) {
  const camera = getNextCamera(state, viewport);

  updatePlayerSystem(state, input, camera, dt);
  updateCombatSystem(state, input, camera);
  updateEnemySystem(state, dt);
  updateCollisionSystem(state);
  updateFeedbackSystem(state, dt);

  state.frame += 1;
  state.stats.mass = state.player.mass;
  state.stats.hp = state.player.hp;
  state.stats.hpMax = state.player.hpMax;
  state.stats.skinName = state.player.skin.name;

  return state;
}
