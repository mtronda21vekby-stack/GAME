import * as THREE from "three";
import { clamp, smoothstep } from "../core/math";
import { disposeObject3D } from "../core/Lifecycle";

export class NexusArchitecture {
  readonly root = new THREE.Group();
  private readonly materials: THREE.MeshStandardMaterial[] = [];
  private readonly arcs = new THREE.Group();
  private readonly structures = new THREE.Group();

  constructor(radialSegments: number) {
    this.root.name = "NexusArchitecture";
    [3.8, 5, 6.25].forEach((radius, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: index === 1 ? 0x142630 : 0x0c171e,
        emissive: 0x0b4a58,
        emissiveIntensity: 0.08,
        metalness: 0.68,
        roughness: 0.58,
        transparent: true,
        opacity: 0,
      });
      const arc = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035 + index * 0.012, 6, radialSegments, Math.PI * 1.42), material);
      arc.rotation.z = -Math.PI * 0.71 + index * 0.13;
      arc.position.z = -2.6 - index * 1.2;
      this.arcs.add(arc);
      this.materials.push(material);
    });

    const beamGeometry = new THREE.BoxGeometry(0.055, 6.4, 0.09);
    [-6.2, -4.7, 4.7, 6.2].forEach((x, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0x0d1820,
        emissive: index % 2 ? 0x082e38 : 0x103947,
        emissiveIntensity: 0.08,
        metalness: 0.62,
        roughness: 0.64,
        transparent: true,
        opacity: 0,
      });
      const beam = new THREE.Mesh(beamGeometry, material);
      beam.position.set(x, index % 2 ? 0.8 : -0.4, -5.4 - (index % 2) * 1.2);
      beam.rotation.z = x < 0 ? -0.08 : 0.08;
      this.structures.add(beam);
      this.materials.push(material);
    });

    const crossBeamMaterial = this.materials[this.materials.length - 1].clone();
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.045, 0.08), crossBeamMaterial);
    crossBeam.position.set(0, -2.65, -5.8);
    this.structures.add(crossBeam);
    this.materials.push(crossBeamMaterial);
    this.root.add(this.arcs, this.structures);
  }

  update(elapsedSeconds: number, progress: number, reducedMotion: boolean) {
    const reveal = smoothstep(clamp((progress - 0.08) / 0.28));
    const energy = smoothstep(clamp((progress - 0.38) / 0.28));
    this.materials.forEach((material, index) => {
      material.opacity = reveal * (0.12 + (index % 3) * 0.035);
      material.emissiveIntensity = 0.06 + energy * 0.14;
    });
    this.arcs.rotation.z = progress * -0.08 + (reducedMotion ? 0 : elapsedSeconds * 0.0025);
    this.structures.position.z = -progress * 0.28;
  }

  dispose() { disposeObject3D(this.root); }
}
