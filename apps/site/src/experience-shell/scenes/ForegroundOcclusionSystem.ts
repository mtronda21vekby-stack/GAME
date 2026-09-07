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

export function createForegroundArmorGeometry() {
  const outline = [
    [-0.36, -0.5], [0.36, -0.5], [0.5, -0.36], [0.5, 0.36],
    [0.36, 0.5], [-0.36, 0.5], [-0.5, 0.36], [-0.5, -0.36],
  ] as const;
  const positions: number[] = [];
  for (const z of [0.5, -0.5]) {
    for (const [x, y] of outline) positions.push(x, y, z);
  }
  const indices: number[] = [];
  for (let index = 1; index < outline.length - 1; index += 1) {
    indices.push(0, index, index + 1);
    indices.push(8, 8 + index + 1, 8 + index);
  }
  for (let index = 0; index < outline.length; index += 1) {
    const next = (index + 1) % outline.length;
    indices.push(index, next, 8 + next, index, 8 + next, 8 + index);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
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
    this.mesh = new THREE.InstancedMesh(createForegroundArmorGeometry(), material, specs.length);
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
