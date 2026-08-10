import * as THREE from "three";
import type { CrownVisual } from "../../experience/assets/CrownAssetAdapter";
import type { EcosystemNodes } from "../../experience/scene/EcosystemNodes";
import type { ParticleField } from "../../experience/scene/ParticleField";
import type { PortalField } from "../../experience/scene/PortalField";
import type { QualityTier, SceneLightingProfile } from "../../experience/types";
import type { SceneLifecycleSnapshot } from "./SceneLifecycle";
import { resolveSceneLightingProfile, SCENE_LIGHTING_PROFILES } from "./SceneLightingProfiles";

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

    crown.root.visible = progress < 0.285 || progress > 0.885;
    portal.root.visible = (progress > 0.18 && progress < 0.275)
      || (progress > 0.49 && progress < 0.565)
      || (progress > 0.65 && progress < 0.715);
    ecosystem.root.visible = false;
    particles.root.visible = true;
  }

  get lightingProfile() { return this.profile; }
}
