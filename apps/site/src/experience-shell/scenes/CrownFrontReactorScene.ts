import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class CrownFrontReactorScene extends SpatialSceneBase {
  private readonly reactor = new THREE.Group();
  private readonly ribs = new THREE.Group();
  private readonly core: THREE.Mesh;

  constructor() {
    super("crown-front-reactor");
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.25, 0.65, 40), this.material(metalMaterial(0x17120f, 0x341207, 0.86), 0.86));
    housing.rotation.x = Math.PI / 2;
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.92, 28, 18), this.material(energyMaterial(0xff7838, 0.62), 0.62));
    this.reactor.add(housing, this.core);
    [2.2, 2.9].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.07, 7, 48), this.material(energyMaterial(index ? 0xff7335 : 0x5fdbe4, index ? 0.48 : 0.2), index ? 0.48 : 0.2));
      ring.position.z = -0.3 - index * 0.65;
      this.reactor.add(ring);
    });
    const ribGeometry = new THREE.BoxGeometry(0.16, 3.8, 0.22);
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      const rib = new THREE.Mesh(ribGeometry, this.material(metalMaterial(0x191512, 0x351406, 0.76), 0.76));
      rib.position.set(Math.cos(angle) * 3.25, Math.sin(angle) * 3.25, -0.9);
      rib.rotation.z = angle;
      this.ribs.add(rib);
    }
    this.root.add(this.reactor, this.ribs);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.position.set(0.55, 0.25, 0);
    const motion = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * 0.055;
    this.reactor.children.forEach((child, index) => { if (index > 1) child.rotation.z = motion * (index % 2 ? -1 : 1) + snapshot.localProgress * 0.22; });
    this.ribs.children.forEach((rib, index) => {
      const angle = (index / 7) * Math.PI * 2;
      const radius = 3.25 + snapshot.localProgress * 0.35;
      rib.position.x = Math.cos(angle) * radius;
      rib.position.y = Math.sin(angle) * radius;
      rib.rotation.z = angle + snapshot.localProgress * 0.11;
    });
    this.core.scale.setScalar(0.82 + snapshot.localProgress * 0.28);
  }
}

