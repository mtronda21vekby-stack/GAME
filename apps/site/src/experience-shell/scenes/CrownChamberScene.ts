import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class CrownChamberScene extends SpatialSceneBase {
  private readonly chamber = new THREE.Group();
  private readonly supports = new THREE.Group();
  private readonly field = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 3.0, 0.08, 28),
    this.material(energyMaterial(0x63e8ef, 0.09), 0.09),
  );
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.1, 0.4, 2.1], scale: [0.34, 7.2, 0.42], rotation: [0.03, 0.08, -0.13], travel: [0.62, -0.1, 0.55] },
    { position: [5.7, 0.8, 1.8], scale: [0.28, 6.5, 0.36], rotation: [-0.02, -0.06, 0.15], travel: [-0.5, 0.18, 0.45] },
    { position: [3.9, -3.05, 1.35], scale: [3.4, 0.24, 0.38], rotation: [0.04, -0.08, -0.04], travel: [-0.45, 0.3, 0.5] },
    { position: [-3.5, 3.35, 1.1], scale: [2.6, 0.18, 0.3], rotation: [-0.04, 0.06, 0.08], travel: [0.35, -0.18, 0.42] },
  ], 0x071116, 0x0a3138);

  constructor() {
    super("crown-chamber");
    this.field.position.set(1.35, -2.48, -0.75);
    const supportMaterial = this.solid(metalMaterial(0x111c21, 0x092b32));
    [3.25, 4.55, 5.85].forEach((radius, index) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.055 + index * 0.016, 6, 56, Math.PI * (1.0 + index * 0.14)),
        supportMaterial,
      );
      arc.position.set(1.3 + index * 0.2, 0.15 - index * 0.12, -2.4 - index * 0.82);
      arc.rotation.set(0.03 * index, -0.04 * index, -2.35 + index * 0.26);
      this.supports.add(arc);
    });

    const beamGeometry = new THREE.BoxGeometry(1, 1, 1);
    const beams = new THREE.InstancedMesh(beamGeometry, supportMaterial, 6);
    const marker = new THREE.Object3D();
    const beamSpecs = [
      [-4.45, -0.1, -3.2, 0.12, 6.2, 0.18, -0.08],
      [-3.15, 1.25, -4.2, 0.1, 4.8, 0.15, -0.04],
      [5.45, 0.1, -3.3, 0.12, 6.5, 0.18, 0.09],
      [6.3, -0.8, -4.4, 0.1, 4.4, 0.15, 0.06],
      [-0.6, 3.45, -4.7, 4.2, 0.1, 0.16, 0.03],
      [3.55, -3.05, -4.3, 3.0, 0.1, 0.16, -0.05],
    ] as const;
    beamSpecs.forEach(([x, y, z, sx, sy, sz, rz], index) => {
      marker.position.set(x, y, z);
      marker.rotation.set(0, 0, rz);
      marker.scale.set(sx, sy, sz);
      marker.updateMatrix();
      beams.setMatrixAt(index, marker.matrix);
    });
    beams.instanceMatrix.needsUpdate = true;

    const floor = new THREE.Mesh(
      new THREE.RingGeometry(2.45, 3.75, 48, 1, 0.25, Math.PI * 1.64),
      this.material(energyMaterial(0x49bbc7, 0.14), 0.14),
    );
    floor.position.set(1.3, -2.28, -0.76);
    floor.rotation.x = -1.16;
    floor.rotation.z = -0.58;
    this.chamber.add(this.supports, beams, floor);
    this.root.add(this.field, this.chamber, this.foreground.root);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const idle = snapshot.reducedMotion ? 0 : Math.sin(snapshot.elapsedSeconds * 0.18) * 0.022;
    this.chamber.rotation.z = -snapshot.localProgress * 0.028 + idle;
    const compact = snapshot.quality === "low";
    this.field.scale.setScalar((0.94 + snapshot.localProgress * 0.1) * (compact ? 0.72 : 1));
    (this.field.material as THREE.MeshBasicMaterial).opacity = (0.07 + snapshot.localProgress * 0.04) * snapshot.weight * (compact ? 0.6 : 1);
    this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }
}
