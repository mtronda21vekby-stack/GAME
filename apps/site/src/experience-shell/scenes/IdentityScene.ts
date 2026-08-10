import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class IdentityScene extends SpatialSceneBase {
  private readonly rings = new THREE.Group();
  private readonly core = new THREE.Mesh(new THREE.SphereGeometry(0.76, 28, 18), this.material(energyMaterial(0x7beaf2, 0.58), 0.58));
  private readonly frame = new THREE.Group();

  constructor() {
    super("identity");
    [1.55, 2.25, 3.05].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.045 + index * 0.012, 6, 48),
        this.material(index === 1 ? energyMaterial(0x6ae5ee, 0.4) : metalMaterial(0x102027, 0x0b4e57, 0.64), index === 1 ? 0.4 : 0.64),
      );
      ring.position.z = -index * 0.48;
      this.rings.add(ring);
    });
    [-1, 0, 1].forEach((offset) => {
      const spire = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2 + (1 - Math.abs(offset)) * 0.9, 0.16), this.material(metalMaterial(0x101b20, 0x0a3d43, 0.72), 0.72));
      spire.position.set(offset * 2.3, 1.3, -1.6);
      spire.rotation.z = offset * -0.12;
      this.frame.add(spire);
    });
    this.root.add(this.rings, this.core, this.frame);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.position.set(0.65, 0.35, 0);
    const motion = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * 0.022;
    this.rings.children.forEach((ring, index) => { ring.rotation.z = motion * (index % 2 ? -1 : 1) + snapshot.localProgress * 0.16; });
    this.core.scale.setScalar(0.68 + snapshot.localProgress * 0.55);
    this.frame.position.y = (1 - snapshot.localProgress) * -0.35;
  }
}

