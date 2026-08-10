import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class CrownChamberScene extends SpatialSceneBase {
  private readonly supports = new THREE.Group();
  private readonly field = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 3.25, 0.08, 48),
    this.material(energyMaterial(0x4bdce9, 0.12), 0.12),
  );

  constructor() {
    super("crown-chamber");
    this.field.position.set(1.05, -2.05, -0.5);
    this.root.add(this.field, this.supports);
    [3.2, 4.4, 5.6].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.035 + index * 0.012, 6, 48, Math.PI * 1.45),
        this.material(metalMaterial(0x10222a, 0x0a5661, 0.36), 0.36),
      );
      ring.position.set(1.05, 0.2, -2.5 - index * 0.75);
      ring.rotation.z = -Math.PI * 0.72 + index * 0.08;
      this.supports.add(ring);
    });
    const beamGeometry = new THREE.BoxGeometry(0.09, 5.8, 0.16);
    [-4.4, -3.2, 5.25, 6.4].forEach((x, index) => {
      const beam = new THREE.Mesh(beamGeometry, this.material(metalMaterial(0x0b1419, 0x08323b, 0.56), 0.56));
      beam.position.set(x, -0.2 + (index % 2) * 0.45, -3.6 - (index % 2) * 0.9);
      beam.rotation.z = x < 0 ? -0.06 : 0.06;
      this.supports.add(beam);
    });
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const idle = snapshot.reducedMotion ? 0 : Math.sin(snapshot.elapsedSeconds * 0.18) * 0.025;
    this.supports.rotation.z = -snapshot.localProgress * 0.035 + idle;
    this.field.scale.setScalar(0.9 + snapshot.localProgress * 0.12);
    (this.field.material as THREE.MeshBasicMaterial).opacity = (0.1 + snapshot.localProgress * 0.07) * snapshot.weight;
  }
}

