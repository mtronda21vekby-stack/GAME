import * as THREE from "three";
import { disposeObject3D } from "../core/Lifecycle";

export class NexusArchitecture {
  readonly root = new THREE.Group();

  constructor(radialSegments: number) {
    this.root.name = "NexusArchitecture";
    const material = new THREE.MeshBasicMaterial({ color: 0x2daac4, wireframe: true, transparent: true, opacity: 0.042 });
    [4.2, 5.4, 6.8].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 6, radialSegments), material.clone());
      ring.rotation.set(Math.PI / 2 + index * 0.22, index * 0.34, index * 0.52);
      this.root.add(ring);
    });
    const floor = new THREE.GridHelper(28, 28, 0x17677a, 0x0b2730);
    floor.position.y = -3.1;
    const floorMaterial = floor.material as THREE.Material;
    floorMaterial.transparent = true;
    floorMaterial.opacity = 0.1;
    this.root.add(floor);
  }

  update(elapsedSeconds: number, progress: number, reducedMotion: boolean) {
    this.root.rotation.y = progress * -0.22 + (reducedMotion ? 0 : elapsedSeconds * 0.006);
  }

  dispose() { disposeObject3D(this.root); }
}
