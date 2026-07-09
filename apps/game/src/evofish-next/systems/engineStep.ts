import type { NextEngineState, NextInputState, NextViewport } from "../core/engineTypes";
import { updateAchievementSystem } from "./achievementSystem";
import { getNextCamera } from "./cameraSystem";
import { updateCollisionSystem } from "./collisionSystem";
import { updateCombatSystem } from "./combatSystem";
import { updateCraftSystem } from "./craftSystem";
import { updateDirectorSystem } from "./directorSystem";
import { updateEnemySystem } from "./enemySystem";
import { updateEventSystem } from "./eventSystem";
import { updateFeedbackSystem } from "./feedbackSystem";
import { updateMutationDraftSystem } from "./mutationDraftSystem";
import { updatePortalSystem } from "./portalSystem";
import { syncProgressionStats } from "./progressionSystem";
import { updateQuestDirectorSystem } from "./questDirectorSystem";
import { updateQuestSystem } from "./questSystem";
import { updatePlayerSystem } from "./playerSystem";
import { updateResourceSystem } from "./resourceSystem";
import { isEvoFishRuntimePaused } from "./runtimePause";
import { updateSurvivalSystem } from "./survivalSystem";
import { updateZoneSystem } from "./zoneSystem";

function freezeInput(input: NextInputState) {
  input.bite = false;
  input.dash = false;
  input.down = false;
  input.moveX = 0;
  input.moveY = 0;
}

function finishPausedFrame(state: NextEngineState, input: NextInputState, dt: number) {
  freezeInput(input);
  updateFeedbackSystem(state, dt);
  syncProgressionStats(state);
  updateQuestSystem(state);
  state.frame += 1;
  return state;
}

export function stepNextEngine(state: NextEngineState, input: NextInputState, viewport: NextViewport, dt: number) {
  const camera = getNextCamera(state, viewport);

  updateMutationDraftSystem(state);

  if (state.mutationDraft || isEvoFishRuntimePaused()) {
    updateCraftSystem(state, 0);
    return finishPausedFrame(state, input, dt);
  }

  updateCraftSystem(state, dt);
  updateSurvivalSystem(state, dt);

  if (state.portalTransition?.active && updatePortalSystem(state, dt)) return finishPausedFrame(state, input, dt);

  if (!state.player.downed) {
    updatePlayerSystem(state, input, camera, dt);
    if (updatePortalSystem(state, dt)) return finishPausedFrame(state, input, dt);
    updateZoneSystem(state, dt);
    updateResourceSystem(state, dt);
    updateQuestDirectorSystem(state);
    updateCombatSystem(state, input, camera);
    updateEnemySystem(state, dt);
    updateDirectorSystem(state, dt);
    updateCollisionSystem(state);
  } else {
    freezeInput(input);
    updatePortalSystem(state, dt);
    updateZoneSystem(state, dt);
    updateResourceSystem(state, dt);
    updateQuestDirectorSystem(state);
    updateEnemySystem(state, dt);
    updateDirectorSystem(state, dt);
  }

  updateCraftSystem(state, dt);
  updateSurvivalSystem(state, dt);
  updateFeedbackSystem(state, dt);
  syncProgressionStats(state);
  updateQuestSystem(state);
  updateAchievementSystem(state);
  updateEventSystem(state, dt);

  state.frame += 1;
  return state;
}
