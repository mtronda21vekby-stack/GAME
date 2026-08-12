import * as THREE from "three";
import type { QualityTier } from "../../experience/types";

export type ForegroundOccluderSpec = {
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
  rotation: readonly [number, number, number];
  travel: readonly [number, number, number];
};

export function getForegroundVisibleCount(total: number, quality: QualityTier, reducedMotion: boolean) {
  if (reducedMotion) return Math.min(1, total);
  if (quality === "low") return Math.min(2, total);
  if (quality === "medium") return Math.min(3, total);
  return total;
}

export function foregroundActivation(localProgress: number, reducedMotion: boolean) {
  if (reducedMotion) return 0.12;
  return Math.min(1, Math.max(0, 0.2 + localProgress * 0.8));
}

export class ForegroundOcclusionSystem {
  readonly root = new THREE.Group();
  private readonly mesh: THREE.InstancedMesh;
  private readonly marker = new THREE.Object3D();

  constructor(private readonly specs: readonly ForegroundOccluderSpec[], color: number, emissive: number) {
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.13,
      metalness: 0.76,
      roughness: 0.48,
    });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, specs.length);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.root.name = "SceneForegroundOcclusion";
    this.root.add(this.mesh);
  }

  evaluate(localProgress: number, quality: QualityTier, reducedMotion: boolean) {
    const count = getForegroundVisibleCount(this.specs.length, quality, reducedMotion);
    const amount = foregroundActivation(localProgress, reducedMotion);
    for (let index = 0; index < this.specs.length; index += 1) {
      const spec = this.specs[index];
      const active = index < count;
      this.marker.position.set(
        spec.position[0] + spec.travel[0] * amount,
        spec.position[1] + spec.travel[1] * amount,
        spec.position[2] + spec.travel[2] * amount,
      );
      this.marker.rotation.set(
        spec.rotation[0],
        spec.rotation[1] + (reducedMotion ? 0 : amount * 0.035 * (index % 2 ? -1 : 1)),
        spec.rotation[2],
      );
      this.marker.scale.set(
        active ? spec.scale[0] : 0,
        active ? spec.scale[1] : 0,
        active ? spec.scale[2] : 0,
      );
      this.marker.updateMatrix();
      this.mesh.setMatrixAt(index, this.marker.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
