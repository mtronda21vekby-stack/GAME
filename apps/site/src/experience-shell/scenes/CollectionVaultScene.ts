import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class CollectionVaultScene extends SpatialSceneBase {
  private readonly rails = new THREE.Group();
  private readonly capsules: THREE.InstancedMesh;
  private readonly indexRing = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.045, 6, 48), this.material(energyMaterial(0x6ae6ef, 0.3), 0.3));

  constructor() {
    super("collection-vault");
    const railGeometry = new THREE.BoxGeometry(0.09, 6.6, 0.12);
    [-3.5, -2.8, 2.8, 3.5].forEach((x, index) => {
      const rail = new THREE.Mesh(railGeometry, this.material(metalMaterial(0x111c21, 0x092e35, 0.68), 0.68));
      rail.position.set(x, 0, -1.2 - (index % 2) * 0.55);
      rail.rotation.z = x < 0 ? -0.06 : 0.06;
      this.rails.add(rail);
    });
    this.capsules = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.42, 0.52, 1.4, 18),
      this.material(metalMaterial(0x182a30, 0x0c6670, 0.78), 0.78),
      4,
    );
    const marker = new THREE.Object3D();
    [-2.1, -0.7, 0.7, 2.1].forEach((x, index) => {
      marker.position.set(x, index % 2 ? -0.28 : 0.32, -0.2 - (index % 2) * 0.35);
      marker.rotation.z = index % 2 ? -0.05 : 0.05;
      marker.updateMatrix();
      this.capsules.setMatrixAt(index, marker.matrix);
    });
    this.capsules.instanceMatrix.needsUpdate = true;
    this.indexRing.position.z = -2.3;
    this.root.add(this.rails, this.capsules, this.indexRing);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.position.set(0.55, 0.25, 0);
    const settle = 1 - snapshot.localProgress;
    this.rails.position.x = settle * 0.32;
    this.rails.scale.y = 0.82 + snapshot.localProgress * 0.18;
    this.capsules.rotation.y = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * 0.035;
    this.indexRing.rotation.z = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * -0.014;
  }
}

