import * as THREE from "three";
import type { ExperienceTimelineState } from "../types";
import { NexusLightingRig } from "../scene/NexusLightingRig";

export class SceneRoot {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();
  private readonly lighting = new NexusLightingRig();

  constructor() {
    this.scene.name = "BlackCrownNexusScene";
    this.scene.background = new THREE.Color(0x010205);
    this.scene.fog = new THREE.FogExp2(0x02050a, 0.044);
    this.root.name = "NexusSceneRoot";
    this.scene.add(this.root);

    this.scene.add(this.lighting.root);
  }

  updateLighting(state: ExperienceTimelineState, objectX: number, objectY: number) {
    this.lighting.update(state, objectX, objectY);
  }

  dispose() {
    this.scene.clear();
  }
}
