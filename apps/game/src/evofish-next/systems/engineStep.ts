import type { NextEngineState, NextInputState, NextViewport } from "../core/engineTypes";
import { getNextCamera } from "./cameraSystem";
import { updateCollisionSystem } from "./collisionSystem";
import { updateCombatSystem } from "./combatSystem";
import { updateEnemySystem } from "./enemySystem";
import { updateFeedbackSystem } from "./feedbackSystem";
import { syncProgressionStats } from "./progressionSystem";
import { updateQuestSystem } from "./questSystem";
import { updatePlayerSystem } from "./playerSystem";

export function stepNextEngine(state: NextEngineState, input: NextInputState, viewport: NextViewport, dt: number) {
  const camera = getNextCamera(state, viewport);

  updatePlayerSystem(state, input, camera, dt);
  updateCombatSystem(state, input, camera);
  updateEnemySystem(state, dt);
  updateCollisionSystem(state);
  updateFeedbackSystem(state, dt);
  syncProgressionStats(state);
  updateQuestSystem(state);

  state.frame += 1;
  return state;
}
