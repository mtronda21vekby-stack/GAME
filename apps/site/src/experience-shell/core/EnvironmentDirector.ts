import * as THREE from "three";
import type { CrownVisual } from "../../experience/assets/CrownAssetAdapter";
import type { EcosystemNodes } from "../../experience/scene/EcosystemNodes";
import type { ParticleField } from "../../experience/scene/ParticleField";
import type { PortalField } from "../../experience/scene/PortalField";
import type { QualityTier, SceneLightingProfile } from "../../experience/types";
import type { SceneLifecycleSnapshot } from "./SceneLifecycle";
import { resolveSceneLightingProfile, SCENE_LIGHTING_PROFILES } from "./SceneLightingProfiles";

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

    // Keep the Crown present through the full hero and the first long transition.
    // It physically leaves upward/back as the ocean rises instead of disappearing
    // on a chapter boundary, then returns for the final camera pass-through.
    const crownExit = smooth((progress - 0.30) / 0.13);
    const finalReturn = smooth((progress - 0.945) / 0.035);
    crown.root.visible = progress < 0.43 || (progress > 0.945 && progress < 0.998);
    if (crown.root.visible) {
      if (progress >= 0.30 && progress < 0.43) {
        const travelScale = reducedMotion ? 0.28 : 1;
        crown.root.position.y += crownExit * 3.1 * travelScale;
        crown.root.position.z -= crownExit * 4.2 * travelScale;
        crown.root.rotation.z -= crownExit * 0.12 * travelScale;
        crown.root.scale.multiplyScalar(1 - crownExit * 0.16 * travelScale);
      } else if (progress > 0.945) {
        const entryOffset = (1 - finalReturn) * (reducedMotion ? 0.35 : 1);
        crown.root.position.y += entryOffset * 1.25;
        crown.root.position.z -= entryOffset * 3.6;
        crown.root.scale.multiplyScalar(0.88 + finalReturn * 0.12);
      }
    }

    portal.root.visible = false;
    ecosystem.root.visible = false;
    particles.root.visible = progress < 0.992;
  }

  get lightingProfile() { return this.profile; }
}
