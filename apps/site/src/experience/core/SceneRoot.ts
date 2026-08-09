import * as THREE from "three";

export class SceneRoot {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();

  constructor() {
    this.scene.name = "BlackCrownNexusScene";
    this.scene.background = new THREE.Color(0x010205);
    this.scene.fog = new THREE.FogExp2(0x02050a, 0.044);
    this.root.name = "NexusSceneRoot";
    this.scene.add(this.root);

    const hemisphere = new THREE.HemisphereLight(0x84efff, 0x030407, 0.72);
    const key = new THREE.DirectionalLight(0xa6f4ff, 1.65);
    key.position.set(4.5, 6, 5);
    const violet = new THREE.PointLight(0x7459ff, 8, 15, 2);
    violet.position.set(-3, 1.5, 3.2);
    const cyan = new THREE.PointLight(0x29dfff, 7, 12, 2);
    cyan.position.set(2.6, -0.8, 2.8);
    this.scene.add(hemisphere, key, violet, cyan);
  }

  dispose() {
    this.scene.clear();
  }
}
