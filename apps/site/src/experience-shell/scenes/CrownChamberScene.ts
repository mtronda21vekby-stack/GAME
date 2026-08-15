import * as THREE from "three";
import { clamp, createSeededRandom, smootherstep } from "../../experience/core/math";
import type { QualityTier } from "../../experience/types";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { createCinematicArtPlane, setCinematicArtTexture } from "./CinematicArtPlane";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";
import { EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";

const ASSEMBLY_FRAGMENT_COUNT = 168;
export const ASSEMBLY_FRAGMENT_COUNTS: Readonly<Record<QualityTier, number>> = {
  low: 32,
  medium: 72,
  high: 112,
};

export function getAssemblyFragmentSourceIndex(renderIndex: number, visibleCount: number, totalCount = ASSEMBLY_FRAGMENT_COUNT) {
  const boundedTotal = Math.max(1, Math.floor(totalCount));
  const boundedVisible = Math.max(1, Math.min(boundedTotal, Math.floor(visibleCount)));
  const boundedIndex = Math.max(0, Math.min(boundedVisible - 1, Math.floor(renderIndex)));
  if (boundedVisible === 1) return 0;
  return Math.round((boundedIndex / (boundedVisible - 1)) * (boundedTotal - 1));
}

export function isCloseAssemblyFragmentSource(sourceIndex: number) {
  return Math.max(0, Math.floor(sourceIndex)) % 16 <= 1;
}

type AssemblyFragment = {
  assembled: THREE.Vector3;
  scattered: THREE.Vector3;
  scatterRotation: THREE.Euler;
  assembledRotation: THREE.Euler;
  scale: THREE.Vector3;
  arcOffset: THREE.Vector3;
  delay: number;
};

export function evaluateAssemblyArc(start: number, end: number, arcOffset: number, amount: number) {
  const directed = smootherstep(clamp(amount));
  return start + (end - start) * directed + Math.sin(directed * Math.PI) * arcOffset;
}

export function shouldShowAssemblyFragments(globalProgress: number, reducedMotion: boolean, dominant: boolean) {
  return dominant
    && !reducedMotion
    && globalProgress >= EXPERIENCE_PHASE_RANGES.nanoAssembly[0]
    && globalProgress < EXPERIENCE_PHASE_RANGES.blackcrownHero[0];
}

export class CrownChamberScene extends SpatialSceneBase {
  private readonly heroPlate = createCinematicArtPlane(7.2, 4.8);
  private currentQuality: QualityTier = "low";
  private readonly chamber = new THREE.Group();
  private readonly supports = new THREE.Group();
  private readonly assemblyFragments: THREE.InstancedMesh;
  private readonly fragmentMarker = new THREE.Object3D();
  private readonly fragmentSpecs: AssemblyFragment[] = [];
  private readonly field = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 3.0, 0.08, 28),
    this.material(energyMaterial(0x63e8ef, 0.09), 0.09),
  );
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.1, 0.4, 2.1], scale: [0.34, 7.2, 0.42], rotation: [0.03, 0.08, -0.13], travel: [0.62, -0.1, 0.55] },
    { position: [5.7, 0.8, 1.8], scale: [0.28, 6.5, 0.36], rotation: [-0.02, -0.06, 0.15], travel: [-0.5, 0.18, 0.45] },
    { position: [3.9, -3.05, 1.35], scale: [3.4, 0.24, 0.38], rotation: [0.04, -0.08, -0.04], travel: [-0.45, 0.3, 0.5] },
    { position: [-3.5, 3.35, 1.1], scale: [2.6, 0.18, 0.3], rotation: [-0.04, 0.06, 0.08], travel: [0.35, -0.18, 0.42] },
  ], 0x071116, 0x0a3138);

  constructor(private readonly assets: AssetSlotRegistry) {
    super("crown-chamber");
    this.heroPlate.mesh.position.set(0, 0.28, 0.55);
    this.field.position.set(1.35, -2.48, -0.75);
    const supportMaterial = this.solid(metalMaterial(0x111c21, 0x092b32));

    const fragmentMaterial = this.material(new THREE.MeshStandardMaterial({
      color: 0x101a1f,
      emissive: 0x0b5b66,
      emissiveIntensity: 0.34,
      metalness: 0.86,
      roughness: 0.38,
      transparent: true,
      opacity: 0.68,
    }), 0.68);
    this.assemblyFragments = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.24, 0.86, 1, 3, 1),
      fragmentMaterial,
      ASSEMBLY_FRAGMENT_COUNT,
    );
    this.assemblyFragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.assemblyFragments.frustumCulled = false;
    const random = createSeededRandom(0xc0a71a);
    for (let index = 0; index < ASSEMBLY_FRAGMENT_COUNT; index += 1) {
      const horizontal = (index / (ASSEMBLY_FRAGMENT_COUNT - 1)) * 2 - 1;
      const shellX = 1.3 + horizontal * 2.25;
      const shellY = -0.78 + (1 - Math.abs(horizontal)) * (0.4 + random() * 1.62);
      // Keep the close-flying shards distributed across the Crown silhouette;
      // quality-tier subsets sample this same ordered source set end-to-end.
      const nearCamera = isCloseAssemblyFragmentSource(index);
      this.fragmentSpecs.push({
        assembled: new THREE.Vector3(shellX, shellY, -0.18 - random() * 0.72),
        scattered: new THREE.Vector3(
          shellX + (random() - 0.5) * 10.5,
          shellY + (random() - 0.5) * 7.2,
          nearCamera ? 2.8 + random() * 3.8 : -1.8 - random() * 6.4,
        ),
        scatterRotation: new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI),
        assembledRotation: new THREE.Euler((random() - 0.5) * 0.18, horizontal * -0.16, horizontal * -0.08),
        scale: new THREE.Vector3(
          (nearCamera ? 0.12 : 0.035) + random() * (nearCamera ? 0.22 : 0.12),
          (nearCamera ? 0.1 : 0.025) + random() * (nearCamera ? 0.18 : 0.08),
          (nearCamera ? 0.28 : 0.08) + random() * (nearCamera ? 0.46 : 0.28),
        ),
        arcOffset: new THREE.Vector3(
          (random() - 0.5) * (nearCamera ? 2.8 : 1.2),
          (random() - 0.5) * (nearCamera ? 3.4 : 1.6),
          (0.35 + random() * (nearCamera ? 2.4 : 0.75)) * (index % 2 ? -1 : 1),
        ),
        delay: random() * 0.42 + Math.abs(horizontal) * 0.12,
      });
    }
    [3.25, 4.55, 5.85].forEach((radius, index) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.055 + index * 0.016, 6, 56, Math.PI * (1.0 + index * 0.14)),
        supportMaterial,
      );
      arc.position.set(1.3 + index * 0.2, 0.15 - index * 0.12, -2.4 - index * 0.82);
      arc.rotation.set(0.03 * index, -0.04 * index, -2.35 + index * 0.26);
      this.supports.add(arc);
    });

    const beamGeometry = new THREE.BoxGeometry(1, 1, 1);
    const beams = new THREE.InstancedMesh(beamGeometry, supportMaterial, 6);
    const marker = new THREE.Object3D();
    const beamSpecs = [
      [-4.45, -0.1, -3.2, 0.12, 6.2, 0.18, -0.08],
      [-3.15, 1.25, -4.2, 0.1, 4.8, 0.15, -0.04],
      [5.45, 0.1, -3.3, 0.12, 6.5, 0.18, 0.09],
      [6.3, -0.8, -4.4, 0.1, 4.4, 0.15, 0.06],
      [-0.6, 3.45, -4.7, 4.2, 0.1, 0.16, 0.03],
      [3.55, -3.05, -4.3, 3.0, 0.1, 0.16, -0.05],
    ] as const;
    beamSpecs.forEach(([x, y, z, sx, sy, sz, rz], index) => {
      marker.position.set(x, y, z);
      marker.rotation.set(0, 0, rz);
      marker.scale.set(sx, sy, sz);
      marker.updateMatrix();
      beams.setMatrixAt(index, marker.matrix);
    });
    beams.instanceMatrix.needsUpdate = true;

    const floor = new THREE.Mesh(
      new THREE.RingGeometry(2.45, 3.75, 48, 1, 0.25, Math.PI * 1.64),
      this.material(energyMaterial(0x49bbc7, 0.14), 0.14),
    );
    floor.position.set(1.3, -2.28, -0.76);
    floor.rotation.x = -1.16;
    floor.rotation.z = -0.58;
    this.chamber.add(this.supports, beams, floor, this.assemblyFragments);
    this.root.add(this.heroPlate.mesh, this.field, this.chamber, this.foreground.root);
  }

  override setQuality(tier: QualityTier) {
    this.currentQuality = tier;
    this.assemblyFragments.count = ASSEMBLY_FRAGMENT_COUNTS[tier];
    super.setQuality(tier);
  }

  async preload() {
    const [heroTexture] = await Promise.all([
      this.assets.loadTexture("blackcrown-hero-plate", this.currentQuality),
      // The final pass is only four percent of the story. Warm its compact
      // plate here so a fast scrub cannot reveal the coarse fallback first.
      this.assets.loadTexture("blackcrown-final-open-plate", this.currentQuality),
    ]);
    setCinematicArtTexture(this.heroPlate, heroTexture);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    const beforeHero = snapshot.globalProgress < EXPERIENCE_PHASE_RANGES.blackcrownHero[0];
    this.chamber.visible = dominant && beforeHero;
    this.field.visible = dominant && beforeHero;
    this.foreground.root.visible = snapshot.weight > 0.65 && beforeHero;
    const idle = snapshot.reducedMotion ? 0 : Math.sin(snapshot.elapsedSeconds * 0.18) * 0.022;
    this.chamber.rotation.z = -snapshot.localProgress * 0.028 + idle;
    const assembly = snapshot.reducedMotion ? 1 : smootherstep(clamp(
      (snapshot.globalProgress - EXPERIENCE_PHASE_RANGES.nanoAssembly[0])
      / (EXPERIENCE_PHASE_RANGES.nanoAssembly[1] - EXPERIENCE_PHASE_RANGES.nanoAssembly[0]),
    ));
    this.assemblyFragments.visible = shouldShowAssemblyFragments(
      snapshot.globalProgress,
      snapshot.reducedMotion,
      dominant,
    );
    if (this.assemblyFragments.visible) {
      for (let index = 0; index < this.assemblyFragments.count; index += 1) {
        const sourceIndex = getAssemblyFragmentSourceIndex(
          index,
          this.assemblyFragments.count,
          this.fragmentSpecs.length,
        );
        const fragment = this.fragmentSpecs[sourceIndex];
        const amount = smootherstep(clamp((assembly - fragment.delay) / Math.max(0.001, 1 - fragment.delay)));
        this.fragmentMarker.position.set(
          evaluateAssemblyArc(fragment.scattered.x, fragment.assembled.x, fragment.arcOffset.x, amount),
          evaluateAssemblyArc(fragment.scattered.y, fragment.assembled.y, fragment.arcOffset.y, amount),
          evaluateAssemblyArc(fragment.scattered.z, fragment.assembled.z, fragment.arcOffset.z, amount),
        );
        this.fragmentMarker.rotation.set(
          fragment.scatterRotation.x + (fragment.assembledRotation.x - fragment.scatterRotation.x) * amount,
          fragment.scatterRotation.y + (fragment.assembledRotation.y - fragment.scatterRotation.y) * amount,
          fragment.scatterRotation.z + (fragment.assembledRotation.z - fragment.scatterRotation.z) * amount,
        );
        const lockPulse = 1 + Math.sin(amount * Math.PI) * 0.24;
        this.fragmentMarker.scale.copy(fragment.scale).multiplyScalar(lockPulse);
        this.fragmentMarker.updateMatrix();
        this.assemblyFragments.setMatrixAt(index, this.fragmentMarker.matrix);
      }
      this.assemblyFragments.instanceMatrix.needsUpdate = true;
    }
    const compact = snapshot.quality === "low";
    const heroIn = smootherstep(clamp(
      (snapshot.globalProgress - (EXPERIENCE_PHASE_RANGES.blackcrownHero[0] - 0.018)) / 0.028,
    ));
    const heroOut = 1 - smootherstep(clamp(
      (snapshot.globalProgress - EXPERIENCE_PHASE_RANGES.blackcrownHero[1]) / 0.038,
    ));
    const heroAmount = heroIn * heroOut * snapshot.weight;
    this.heroPlate.mesh.visible = Boolean(this.heroPlate.material.map) && heroAmount > 0.001;
    this.heroPlate.mesh.position.set(
      compact ? 0 : 1.1 - (snapshot.globalProgress - 0.25) * 0.35,
      compact ? 0.62 : 0.24,
      0.55 - heroAmount * 0.08,
    );
    // Preserve the complete outer shell on portrait phones; the approved
    // mobile composition must never crop the two outer Crown spires.
    this.heroPlate.mesh.scale.setScalar(compact ? 0.68 : 0.76);
    this.heroPlate.material.opacity = heroAmount * (compact ? 0.72 : 0.82);
    this.root.userData.bcHeroPlateOpacity = this.heroPlate.mesh.visible
      ? this.heroPlate.material.opacity
      : 0;
    this.field.scale.setScalar((0.94 + snapshot.localProgress * 0.1) * (compact ? 0.72 : 1));
    (this.field.material as THREE.MeshBasicMaterial).opacity = (0.07 + snapshot.localProgress * 0.04) * snapshot.weight * (compact ? 0.6 : 1);
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }

  override dispose() {
    this.heroPlate.material.map = null;
    super.dispose();
  }
}
