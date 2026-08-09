import * as THREE from "three";
import { disposeObject3D } from "../core/Lifecycle";

export class PortalField {
  readonly root = new THREE.Group();
  private readonly materials: THREE.MeshBasicMaterial[] = [];

  constructor(radialSegments: number) {
    this.root.name = "CrownFrontPortalField";
    for (let index = 0; index < 6; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? 0xff6f2d : 0x54e8ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15 + index * 0.25, 0.018, 8, radialSegments), material);
      ring.position.set(0, 0.33, -1.4 - index * 0.46);
      ring.rotation.z = index * 0.27;
      this.root.add(ring);
      this.materials.push(material);
    }
  }

  update(elapsedSeconds: number, portal: number, orange: number, reducedMotion: boolean) {
    this.root.visible = portal > 0.001;
    this.root.scale.setScalar(0.5 + portal * 0.72);
    if (!reducedMotion) this.root.rotation.z = elapsedSeconds * -0.035;
    this.materials.forEach((material, index) => {
      material.opacity = portal * (0.12 + (index % 3) * 0.055);
      material.color.setHex(index % 2 && orange > 0.15 ? 0xff7132 : 0x58e9ff);
    });
  }

  dispose() { disposeObject3D(this.root); }
}
