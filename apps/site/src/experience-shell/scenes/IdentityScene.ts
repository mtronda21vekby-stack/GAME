import { clamp, smootherstep } from "../../experience/core/math";
import type { QualityTier } from "../../experience/types";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";
import { createCinematicArtPlane, setCinematicArtTexture } from "./CinematicArtPlane";
import { SpatialSceneBase } from "./SpatialSceneBase";

const FINAL_START = EXPERIENCE_PHASE_RANGES.finalCrownPass[0];
const FINAL_SPAN = EXPERIENCE_PHASE_RANGES.finalCrownPass[1] - FINAL_START;
const FINAL_PLATE_LOCK = FINAL_START + FINAL_SPAN * 0.625;
const FINAL_PLATE_RELEASE = FINAL_START + FINAL_SPAN * 0.85;

export function evaluateFinalCrownPlate(progress: number, weight: number, reducedMotion = false) {
  const approach = smootherstep(clamp((progress - FINAL_START) / (FINAL_PLATE_LOCK - FINAL_START)));
  const release = 1 - smootherstep(clamp((progress - FINAL_PLATE_LOCK) / (FINAL_PLATE_RELEASE - FINAL_PLATE_LOCK)));
  const lifecyclePresence = Math.min(1, clamp(weight) * 1.6);
  return {
    approach,
    opacity: lifecyclePresence * (0.16 + approach * 0.84) * release * (reducedMotion ? 0.76 : 0.92),
    depth: 0.54 + approach * 0.2,
    scale: 0.9 + approach * 0.1,
  };
}

/** Beauty plate for the approach; live Candidate B remains underneath and is
 * fully exposed before the camera crosses its real core. */
export class IdentityScene extends SpatialSceneBase {
  private readonly finalCrownPlate = createCinematicArtPlane(6.8, 4.53);
  private currentQuality: QualityTier = "low";

  constructor(private readonly assets: AssetSlotRegistry) {
    super("identity");
    this.finalCrownPlate.mesh.renderOrder = 8;
    this.root.add(this.finalCrownPlate.mesh);
  }

  override setQuality(tier: QualityTier) {
    this.currentQuality = tier;
    super.setQuality(tier);
  }

  async preload() {
    setCinematicArtTexture(
      this.finalCrownPlate,
      await this.assets.loadTexture("blackcrown-final-open-plate", this.currentQuality),
    );
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const state = evaluateFinalCrownPlate(snapshot.globalProgress, snapshot.weight, snapshot.reducedMotion);
    const qualityFit = snapshot.quality === "low" ? 0.29 : snapshot.quality === "medium" ? 0.42 : 0.54;
    // The generated Crown's core sits below the source-image midpoint. Lift
    // the plate so the passage, not the decorative spire, owns screen center
    // on both desktop and portrait iPhone.
    this.finalCrownPlate.mesh.position.set(0, 1.05, state.depth);
    this.finalCrownPlate.mesh.scale.setScalar(qualityFit * state.scale);
    this.finalCrownPlate.material.opacity = state.opacity;
    this.root.visible = Boolean(this.finalCrownPlate.material.map) && state.opacity > 0.001;
    this.root.userData.bcFinalCrownPlateOpacity = this.root.visible ? state.opacity : 0;
  }

  override dispose() {
    this.finalCrownPlate.material.map = null;
    super.dispose();
  }
}
