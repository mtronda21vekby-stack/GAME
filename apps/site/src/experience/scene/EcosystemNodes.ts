import * as THREE from "three";
import { disposeObject3D } from "../core/Lifecycle";
import { clamp, smoothstep } from "../core/math";

export class EcosystemNodes {
  readonly root = new THREE.Group();
  private readonly nodes: THREE.Group[] = [];

  constructor(count: number) {
    this.root.name = "EcosystemNodes";
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const node = new THREE.Group();
      const shell = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color: 0x09141b, emissive: index === 2 ? 0x9c3414 : 0x1b8ca2, emissiveIntensity: 0.65, metalness: 0.74, roughness: 0.28 }),
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.012, 6, 24),
        new THREE.MeshBasicMaterial({ color: index === 2 ? 0xff7b38 : 0x67eaff, transparent: true, opacity: 0.45 }),
      );
      node.position.set(Math.sin(angle) * 4.1, Math.sin(angle * 2) * 0.72, Math.cos(angle) * 4.1);
      node.add(shell, ring);
      this.root.add(node);
      this.nodes.push(node);
    }
    this.root.scale.setScalar(0.001);
  }

  update(elapsedSeconds: number, progress: number, enter: number, reducedMotion: boolean) {
    const reveal = smoothstep(clamp(progress));
    this.root.scale.setScalar(Math.max(0.001, reveal * (1 - enter * 0.72)));
    this.nodes.forEach((node, index) => {
      if (!reducedMotion) node.rotation.y = elapsedSeconds * (0.12 + index * 0.008);
    });
  }

  dispose() { disposeObject3D(this.root); }
}
