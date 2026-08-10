import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial } from "./SpatialSceneBase";

export class IdentityScene extends SpatialSceneBase {
  private readonly profileArcs = new THREE.Group();
  private readonly core = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), this.material(energyMaterial(0x91f0f2, 0.34), 0.34));
  private readonly dataColumns: THREE.InstancedMesh;
  private readonly axis = new THREE.Mesh(new THREE.BoxGeometry(0.035, 6.8, 0.06), this.material(energyMaterial(0x69dbe5, 0.2), 0.2));
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.0, 0.45, 2.05], scale: [0.34, 6.7, 0.34], rotation: [0.03, 0.12, -0.16], travel: [0.72, 0.1, 0.6] },
    { position: [5.2, -0.25, 1.95], scale: [0.3, 6.4, 0.32], rotation: [-0.03, -0.1, 0.14], travel: [-0.68, 0.12, 0.62] },
    { position: [3.1, 3.45, 1.25], scale: [3.2, 0.22, 0.28], rotation: [0.05, 0.08, -0.08], travel: [-0.52, -0.55, 0.48] },
    { position: [-2.9, -3.35, 1.3], scale: [3.4, 0.2, 0.28], rotation: [-0.04, -0.06, 0.08], travel: [0.5, 0.52, 0.5] },
  ], 0x091318, 0x0c333a);

  constructor() {
    super("identity");
    const shell = this.solid(new THREE.MeshStandardMaterial({
      color: 0x172b31,
      emissive: 0x0c353c,
      emissiveIntensity: 0.24,
      metalness: 0.72,
      roughness: 0.48,
    }));
    [
      [1.55, 1.1, 0.2, 0.38],
      [2.35, 0.76, -0.45, -0.62],
      [3.25, 0.54, -1.1, 0.94],
    ].forEach(([radius, ratio, z, rotation], index) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.05 + index * 0.018, 6, 46, Math.PI * ratio),
        index === 1 ? this.material(energyMaterial(0x6de5ec, 0.34), 0.34) : shell,
      );
      arc.position.set(index * 0.22 - 0.2, index * 0.14, z);
      arc.rotation.z = rotation;
      this.profileArcs.add(arc);
    });

    this.dataColumns = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), shell, 7);
    const marker = new THREE.Object3D();
    [-3.25, -2.3, -1.2, 0, 1.35, 2.5, 3.35].forEach((x, index) => {
      const height = 1.35 + (index === 3 ? 1.8 : (index % 3) * 0.38);
      marker.position.set(x, 0.55 + height * 0.25, -1.65 - Math.abs(index - 3) * 0.18);
      marker.rotation.set(0, 0, (index - 3) * -0.025);
      marker.scale.set(0.12, height, 0.18);
      marker.updateMatrix();
      this.dataColumns.setMatrixAt(index, marker.matrix);
    });
    this.dataColumns.instanceMatrix.needsUpdate = true;
    this.axis.position.z = -1.8;
    this.core.position.set(0.45, 1.1, -0.55);
    this.root.add(this.profileArcs, this.core, this.axis, this.dataColumns, this.foreground.root);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    this.dataColumns.visible = dominant;
    this.foreground.root.visible = snapshot.weight > 0.65;
    this.root.position.set(0.2, 0.42, 0);
    const motion = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds;
    this.profileArcs.children.forEach((arc, index) => {
      arc.rotation.z = (index === 0 ? 0.38 : index === 1 ? -0.62 : 0.94)
        + snapshot.localProgress * (index % 2 ? -0.12 : 0.09)
        + motion * (index % 2 ? -0.008 : 0.006);
    });
    this.core.rotation.set(motion * 0.035, -motion * 0.05, snapshot.localProgress * 0.16);
    this.core.scale.setScalar(0.76 + snapshot.localProgress * 0.2);
    this.dataColumns.position.y = (1 - snapshot.localProgress) * -0.48;
    this.axis.scale.y = 0.65 + snapshot.localProgress * 0.35;
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }
}
