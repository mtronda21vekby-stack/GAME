import * as THREE from "three";
import { createSeededRandom } from "../core/math";
import { disposeObject3D } from "../core/Lifecycle";

export class ParticleField {
  readonly root = new THREE.Group();
  private readonly far: THREE.Points;
  private readonly foreground: THREE.Points;

  constructor(count: number, foregroundCount: number) {
    this.root.name = "NexusParticleField";
    this.far = this.createPoints(count, 0x69eaff, 18, 0x51bc2026, 0.025);
    this.foreground = this.createPoints(foregroundCount, 0xa48cff, 9, 0xc04f2026, 0.045);
    this.foreground.position.z = 2.4;
    this.root.add(this.far, this.foreground);
  }

  private createPoints(count: number, color: number, radius: number, seed: number, size: number) {
    const random = createSeededRandom(seed);
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] = (random() - 0.5) * radius;
      positions[offset + 1] = (random() - 0.5) * radius * 0.7;
      positions[offset + 2] = (random() - 0.5) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return new THREE.Points(geometry, material);
  }

  update(elapsedSeconds: number, progress: number, reducedMotion: boolean) {
    if (reducedMotion) return;
    this.far.rotation.y = elapsedSeconds * 0.012 + progress * 0.08;
    this.foreground.rotation.y = -elapsedSeconds * 0.025 + progress * 0.22;
    this.foreground.position.y = Math.sin(elapsedSeconds * 0.18) * 0.12;
  }

  dispose() { disposeObject3D(this.root); }
}
