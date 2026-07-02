import type { NextEngineState, NextInputState, NextViewport } from "../core/engineTypes";
import { getNextCamera } from "./cameraSystem";
import { updateCollisionSystem } from "./collisionSystem";
import { updateCombatSystem } from "./combatSystem";
import { updateCraftSystem } from "./craftSystem";
import { updateDirectorSystem } from "./directorSystem";
import { updateEnemySystem } from "./enemySystem";
import { updateFeedbackSystem } from "./feedbackSystem";
import { syncProgressionStats } from "./progressionSystem";
import { updateQuestSystem } from "./questSystem";
import { updatePlayerSystem } from "./playerSystem";
import { updateResourceSystem } from "./resourceSystem";
import { updateSurvivalSystem } from "./survivalSystem";
import { updateZoneSystem } from "./zoneSystem";

export function stepNextEngine(state: NextEngineState, input: NextInputState, viewport: NextViewport, dt: number) {
  const camera = getNextCamera(state, viewport);

  updateCraftSystem(state, dt);
  updateSurvivalSystem(state, dt);

  if (!state.player.downed) {
    updatePlayerSystem(state, input, camera, dt);
    updateZoneSystem(state, dt);
    updateResourceSystem(state, dt);
    updateCombatSystem(state, input, camera);
    updateEnemySystem(state, dt);
    updateDirectorSystem(state, dt);
    updateCollisionSystem(state);
  } else {
    input.bite = false;
    input.dash = false;
    input.down = false;
    updateZoneSystem(state, dt);
    updateResourceSystem(state, dt);
    updateEnemySystem(state, dt);
    updateDirectorSystem(state, dt);
  }

  updateCraftSystem(state, dt);
  updateSurvivalSystem(state, dt);
  updateFeedbackSystem(state, dt);
  syncProgressionStats(state);
  updateQuestSystem(state);

  state.frame += 1;
  return state;
}
