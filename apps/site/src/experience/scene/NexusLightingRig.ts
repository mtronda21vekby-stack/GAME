import * as THREE from "three";
import type { ExperienceTimelineState, SceneLightingProfile } from "../types";

export class NexusLightingRig {
  readonly root = new THREE.Group();
  private readonly key = new THREE.DirectionalLight(0xc2eef1, 2.35);
  private readonly fill = new THREE.DirectionalLight(0x718399, 0.58);
  private readonly rim = new THREE.PointLight(0x39d4e8, 3.2, 12, 2);
  private readonly violet = new THREE.PointLight(0x6554bd, 1.2, 10, 2);
  private readonly orange = new THREE.PointLight(0xff6d2f, 0, 8, 2);
  private readonly hemisphere = new THREE.HemisphereLight(0x83a8b5, 0x010203, 0.42);

  constructor() {
    this.root.name = "NexusLightingRig";
    this.key.position.set(4.5, 5.8, 6.5);
    this.fill.position.set(-4, -1.5, 4.5);
    this.rim.position.set(-2.8, 2.4, -2.5);
    this.violet.position.set(3.4, -0.8, -1.4);
    this.orange.position.set(0, -0.1, 2.5);
    this.root.add(this.hemisphere, this.key, this.fill, this.rim, this.violet, this.orange);
  }

  update(state: ExperienceTimelineState, objectX: number, objectY: number, profile: Readonly<SceneLightingProfile>) {
    this.root.position.set(objectX, objectY, 0);
    this.key.color.setHex(profile.keyColor);
    this.key.intensity = profile.keyIntensity + state.inspection * 0.18;
    this.fill.color.setHex(profile.fillColor);
    this.fill.intensity = profile.fillIntensity;
    this.rim.color.setHex(profile.rimColor);
    this.rim.intensity = profile.rimIntensity + state.open * 0.18;
    this.violet.color.setHex(profile.coreColor);
    this.violet.intensity = profile.coreIntensity * 0.34;
    this.orange.color.setHex(profile.coreColor);
    this.orange.intensity = profile.coreIntensity * (0.4 + state.coreIntensity * 0.32);
    this.hemisphere.color.setHex(profile.keyColor);
    this.hemisphere.intensity = 0.28 + profile.fillIntensity * 0.28;
  }
}
