import * as THREE from "three";
import type { CrownVisual } from "../../experience/assets/CrownAssetAdapter";
import type { EcosystemNodes } from "../../experience/scene/EcosystemNodes";
import type { ParticleField } from "../../experience/scene/ParticleField";
import type { PortalField } from "../../experience/scene/PortalField";
import type { QualityTier, SceneLightingProfile } from "../../experience/types";
import type { SceneLifecycleSnapshot } from "./SceneLifecycle";
import { resolveSceneLightingProfile, SCENE_LIGHTING_PROFILES } from "./SceneLightingProfiles";
import { EXPERIENCE_FINAL_BLACKOUT_PROGRESS, EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export class EnvironmentDirector {
  private readonly profile: SceneLightingProfile = { ...SCENE_LIGHTING_PROFILES["crown-chamber"] };

  constructor(private readonly scene: THREE.Scene) {}

  update(
    progress: number,
    lifecycle: SceneLifecycleSnapshot,
    quality: QualityTier,
    reducedMotion: boolean,
    crown: CrownVisual,
    particles: ParticleField,
    portal: PortalField,
    ecosystem: EcosystemNodes,
  ) {
    resolveSceneLightingProfile(lifecycle, quality, reducedMotion, this.profile);
    if (this.scene.background instanceof THREE.Color) this.scene.background.setHex(this.profile.background);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(this.profile.fogColor);
      this.scene.fog.density = this.profile.fogDensity;
    }

    const crownExit = smooth(
      (progress - EXPERIENCE_PHASE_RANGES.crownToOcean[0])
      / (EXPERIENCE_PHASE_RANGES.crownToOcean[1] - EXPERIENCE_PHASE_RANGES.crownToOcean[0]),
    );
    const finalPassStart = EXPERIENCE_PHASE_RANGES.finalCrownPass[0];
    const finalArrival = (finalPassStart + EXPERIENCE_PHASE_RANGES.finalCrownPass[1]) * 0.5;
    const finalReturn = smooth((progress - finalPassStart) / (finalArrival - finalPassStart));
    let crownRotationZOffset = 0;
    crown.root.visible = progress < EXPERIENCE_PHASE_RANGES.crownToOcean[1]
      || (progress >= finalPassStart && progress < EXPERIENCE_FINAL_BLACKOUT_PROGRESS);
    if (crown.root.visible) {
      if (progress >= EXPERIENCE_PHASE_RANGES.crownToOcean[0]
        && progress < EXPERIENCE_PHASE_RANGES.crownToOcean[1]) {
        const travelScale = reducedMotion ? 0.28 : 1;
        crown.root.position.y += crownExit * 3.1 * travelScale;
        crown.root.position.z -= crownExit * 4.2 * travelScale;
        crownRotationZOffset = -crownExit * 0.12 * travelScale;
        crown.root.scale.multiplyScalar(1 - crownExit * 0.16 * travelScale);
      } else if (progress >= finalPassStart) {
        const entryOffset = (1 - finalReturn) * (reducedMotion ? 0.35 : 1);
        crown.root.position.y += entryOffset * 1.25;
        crown.root.position.z -= entryOffset * 3.6;
        crown.root.scale.multiplyScalar(0.88 + finalReturn * 0.12);
      }
    }

    portal.root.visible = false;
    ecosystem.root.visible = false;
    // The final pass is Crown-only: the network/collection field has already
    // receded and the DOM identity arrives after the camera crosses the core.
    particles.root.visible = progress < finalPassStart;
    return { crownRotationZOffset };
  }

  get lightingProfile() { return this.profile; }
}
