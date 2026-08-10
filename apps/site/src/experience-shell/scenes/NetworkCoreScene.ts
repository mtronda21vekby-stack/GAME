import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class NetworkCoreScene extends SpatialSceneBase {
  private readonly core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 2), this.material(energyMaterial(0x61e4ef, 0.5), 0.5));
  private readonly arcs = new THREE.Group();
  private readonly nodes: THREE.InstancedMesh;

  constructor() {
    super("network-core");
    [2.3, 3.45, 4.65].forEach((radius, index) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.035 + index * 0.012, 5, 48, Math.PI * (1.25 + index * 0.08)),
        this.material(index === 1 ? energyMaterial(0x65e9f5, 0.36) : metalMaterial(0x0d1b21, 0x0a3b43, 0.55), index === 1 ? 0.36 : 0.55),
      );
      arc.position.z = -0.5 - index * 0.7;
      arc.rotation.z = -1.9 + index * 0.35;
      this.arcs.add(arc);
    });
    const nodeMaterial = this.material(metalMaterial(0x14252b, 0x0b6b74, 0.82), 0.82);
    this.nodes = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.25, 1), nodeMaterial, 9);
    const marker = new THREE.Object3D();
    for (let index = 0; index < 9; index += 1) {
      const band = index % 3;
      const angle = (index / 9) * Math.PI * 2 + band * 0.34;
      const radius = 2.15 + band * 1.05;
      marker.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.64, -0.4 - band * 0.75);
      marker.scale.setScalar(index < 3 ? 1.2 : index < 6 ? 0.92 : 0.68);
      marker.updateMatrix();
      this.nodes.setMatrixAt(index, marker.matrix);
    }
    this.nodes.instanceMatrix.needsUpdate = true;
    this.root.add(this.core, this.arcs, this.nodes);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.position.set(0.45, 0.3, 0);
    const idle = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * 0.018;
    this.core.rotation.set(idle * 0.7, -idle, 0);
    this.core.scale.setScalar(0.78 + snapshot.localProgress * 0.25);
    this.arcs.children.forEach((arc, index) => { arc.rotation.z = -1.9 + index * 0.35 + idle * (index % 2 ? -1 : 1); });
    this.nodes.rotation.z = snapshot.reducedMotion ? 0 : -idle * 0.3;
  }
}

