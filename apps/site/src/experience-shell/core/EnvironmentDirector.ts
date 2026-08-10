import * as THREE from "three";
import type { CrownVisual } from "../../experience/assets/CrownAssetAdapter";
import type { EcosystemNodes } from "../../experience/scene/EcosystemNodes";
import type { ParticleField } from "../../experience/scene/ParticleField";
import type { PortalField } from "../../experience/scene/PortalField";
import { clamp, smoothstep } from "../../experience/core/math";

export class EnvironmentDirector {
  private readonly baseColor = new THREE.Color(0x010205);
  private readonly oceanColor = new THREE.Color(0x01131d);
  private readonly tacticalColor = new THREE.Color(0x100603);
  private readonly networkColor = new THREE.Color(0x02080d);
  private readonly workingColor = new THREE.Color();

  constructor(private readonly scene: THREE.Scene) {}

  update(
    progress: number,
    crown: CrownVisual,
    particles: ParticleField,
    portal: PortalField,
    ecosystem: EcosystemNodes,
  ) {
    const ocean = smoothstep(clamp((progress - 0.32) / 0.1)) * (1 - smoothstep(clamp((progress - 0.5) / 0.08)));
    const tactical = smoothstep(clamp((progress - 0.49) / 0.09)) * (1 - smoothstep(clamp((progress - 0.67) / 0.08)));
    const network = smoothstep(clamp((progress - 0.64) / 0.12));
    this.workingColor.copy(this.baseColor).lerp(this.oceanColor, ocean).lerp(this.tacticalColor, tactical).lerp(this.networkColor, network * 0.72);
    if (this.scene.background instanceof THREE.Color) this.scene.background.copy(this.workingColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.workingColor);
      this.scene.fog.density = 0.038 + ocean * 0.03 + tactical * 0.012 - network * 0.008;
    }

    crown.root.visible = progress < 0.375 || progress > 0.885;
    portal.root.visible = (progress > 0.17 && progress < 0.4) || (progress > 0.48 && progress < 0.71) || progress > 0.88;
    ecosystem.root.visible = progress > 0.64 && progress < 0.84;
    particles.root.visible = true;
  }
}

