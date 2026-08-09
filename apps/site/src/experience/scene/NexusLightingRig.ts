import * as THREE from "three";
import type { ExperienceTimelineState } from "../types";

export class NexusLightingRig {
  readonly root = new THREE.Group();
  private readonly key = new THREE.DirectionalLight(0xc2eef1, 2.35);
  private readonly fill = new THREE.DirectionalLight(0x718399, 0.58);
  private readonly rim = new THREE.PointLight(0x39d4e8, 3.2, 12, 2);
  private readonly violet = new THREE.PointLight(0x6554bd, 1.2, 10, 2);
  private readonly orange = new THREE.PointLight(0xff6d2f, 0, 8, 2);

  constructor() {
    this.root.name = "NexusLightingRig";
    const hemisphere = new THREE.HemisphereLight(0x83a8b5, 0x010203, 0.42);
    this.key.position.set(4.5, 5.8, 6.5);
    this.fill.position.set(-4, -1.5, 4.5);
    this.rim.position.set(-2.8, 2.4, -2.5);
    this.violet.position.set(3.4, -0.8, -1.4);
    this.orange.position.set(0, -0.1, 2.5);
    this.root.add(hemisphere, this.key, this.fill, this.rim, this.violet, this.orange);
  }

  update(state: ExperienceTimelineState, objectX: number, objectY: number) {
    this.root.position.set(objectX, objectY, 0);
    this.key.intensity = 2.1 + state.inspection * 0.58 - state.portal * 0.24;
    this.fill.intensity = 0.5 + state.open * 0.16;
    this.rim.intensity = 2.5 + state.assembly * 0.7 + state.open * 0.8;
    this.violet.intensity = 0.8 + state.coreIntensity * 0.5;
    this.orange.intensity = state.tacticalOrange * (4.2 + state.portal * 3.4);
  }
}
