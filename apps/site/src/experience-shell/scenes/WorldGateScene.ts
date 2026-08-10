import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class WorldGateScene extends SpatialSceneBase {
  private readonly rings = new THREE.Group();
  private readonly shutters = new THREE.Group();
  private readonly aperture: THREE.Mesh;

  constructor() {
    super("world-gate");
    [1.45, 2.1, 2.85, 3.6].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.055 + index * 0.014, 6, 52),
        this.material(index === 1 ? energyMaterial(0x68eaf4, 0.58) : metalMaterial(0x102129, 0x0b6771, 0.64), index === 1 ? 0.58 : 0.64),
      );
      ring.position.z = -index * 0.72;
      this.rings.add(ring);
    });
    const shutterGeometry = new THREE.BoxGeometry(0.18, 1.45, 0.14);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const shutter = new THREE.Mesh(shutterGeometry, this.material(metalMaterial(0x111c21, 0x0a3338, 0.8), 0.8));
      shutter.position.set(Math.cos(angle) * 3.15, Math.sin(angle) * 3.15, 0.35);
      shutter.rotation.z = angle;
      this.shutters.add(shutter);
    }
    this.aperture = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), this.material(energyMaterial(0x48dce9, 0.3), 0.3));
    this.aperture.position.z = -2.9;
    this.root.add(this.rings, this.shutters, this.aperture);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.position.set(0.65, 0.4, 0);
    const motion = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * 0.035;
    this.rings.children.forEach((ring, index) => { ring.rotation.z = motion * (index % 2 ? -1 : 1) + snapshot.localProgress * (0.24 + index * 0.07); });
    this.shutters.children.forEach((shutter, index) => {
      const angle = (index / 6) * Math.PI * 2;
      const radius = 3.15 + snapshot.localProgress * 0.72;
      shutter.position.x = Math.cos(angle) * radius;
      shutter.position.y = Math.sin(angle) * radius;
      shutter.rotation.z = angle + snapshot.localProgress * 0.16;
    });
    this.aperture.scale.setScalar(0.72 + snapshot.localProgress * 0.52);
  }
}

