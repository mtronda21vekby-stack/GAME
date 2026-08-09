import * as THREE from "three";
import { createSeededRandom } from "../core/math";
import { disposeObject3D } from "../core/Lifecycle";

export class ParticleField {
  readonly root = new THREE.Group();
  private readonly far: THREE.Points;
  private readonly mid: THREE.Points;
  private readonly foreground: THREE.Points;

  constructor(count: number, foregroundCount: number) {
    this.root.name = "NexusParticleField";
    const farCount = Math.max(24, Math.round(count * 0.62));
    const midCount = Math.max(12, count - farCount);
    this.far = this.createPoints(farCount, 0x6ec7d2, [19, 12, 20], 0x51bc2026, 0.018, 0.3);
    this.mid = this.createPoints(midCount, 0x5bd8e8, [11, 7, 12], 0x7aa32026, 0.026, 0.4);
    this.foreground = this.createPoints(foregroundCount, 0x8f7dde, [8, 5.5, 5], 0xc04f2026, 0.055, 0.32);
    this.foreground.position.z = 2.2;
    this.root.add(this.far, this.mid, this.foreground);
  }

  private createPoints(
    count: number,
    color: number,
    spread: [number, number, number],
    seed: number,
    size: number,
    opacity: number,
  ) {
    const random = createSeededRandom(seed);
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const lane = index % 5;
      positions[offset] = (random() - 0.5) * spread[0];
      positions[offset + 1] = (random() - 0.5) * spread[1] + (lane - 2) * 0.08;
      positions[offset + 2] = (random() - 0.5) * spread[2];
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return new THREE.Points(geometry, material);
  }

  update(elapsedSeconds: number, progress: number, reducedMotion: boolean) {
    const reducedFactor = reducedMotion ? 0.2 : 1;
    (this.far.material as THREE.PointsMaterial).opacity = reducedMotion ? 0.14 : 0.3;
    (this.mid.material as THREE.PointsMaterial).opacity = (0.22 + progress * 0.18) * reducedFactor;
    (this.foreground.material as THREE.PointsMaterial).opacity = (0.12 + progress * 0.2) * reducedFactor;
    if (reducedMotion) return;
    this.far.rotation.y = elapsedSeconds * 0.004 + progress * 0.035;
    this.mid.rotation.y = elapsedSeconds * -0.009 + progress * 0.12;
    this.mid.position.z = Math.sin(progress * Math.PI) * 0.26;
    this.foreground.rotation.y = -elapsedSeconds * 0.016 + progress * 0.18;
    this.foreground.position.y = Math.sin(elapsedSeconds * 0.12) * 0.09;
  }

  dispose() { disposeObject3D(this.root); }
}
