import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase } from "./SpatialSceneBase";

/**
 * Lifecycle sentinel for the final chapter.
 *
 * The approved ending is deliberately DOM-only after the camera crosses the
 * live Crown core, so this scene owns no geometry or asset preload.
 */
export class IdentityScene extends SpatialSceneBase {
  constructor() {
    super("identity");
  }

  evaluate(_snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.visible = false;
  }
}
