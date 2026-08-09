import * as THREE from "three";
import { clamp, smoothstep, smootherstep } from "../../core/math";
import type { CrownVisual, CrownVisualState } from "../CrownAssetAdapter";
import type { CrownAssetManifest } from "../CrownAssetManifest";
import type { CrownLOD, CrownAssetDiagnostics } from "../CrownAssetAdapter";
import { getCrownLoaderCounters, recordCrownAttach } from "../CrownAssetCache";
import { applyGLBCrownMaterials, type GLBCrownMaterialBindings } from "./GLBCrownMaterials";
import { bindGLBCrown, restoreTransform, type GLBCrownBindings, type TransformSnapshot } from "./GLBCrownBindings";
import type { LoadedCrownInstance } from "./GLBCrownLoader";
import type { QualityTier } from "../../types";

type SegmentMotion = {
  object: THREE.Object3D;
  base: TransformSnapshot;
  scatterPosition: THREE.Vector3;
  scatterQuaternion: THREE.Quaternion;
  normalized: number;
  delay: number;
};

const CYAN = new THREE.Color(0x26c9e4);
const ORANGE = new THREE.Color(0xff5f21);

export class GLBCrownAdapter implements CrownVisual {
  readonly root = new THREE.Group();
  readonly shell: THREE.Group;
  readonly core: THREE.Object3D;
  readonly rings: THREE.Object3D[];
  readonly diagnostics: CrownAssetDiagnostics;
  private readonly bindings: GLBCrownBindings;
  private readonly materials: GLBCrownMaterialBindings;
  private readonly loaded: LoadedCrownInstance;
  private readonly motions: SegmentMotion[];
  private assemblyProgress = 0;
  private openProgress = 0;
  private coreIntensity = 0;
  private portalProgress = 0;
  private disposed = false;

  constructor(loaded: LoadedCrownInstance, manifest: CrownAssetManifest, lod: CrownLOD, quality: QualityTier, renderer: THREE.WebGLRenderer) {
    this.loaded = loaded;
    this.bindings = bindGLBCrown(loaded.scene, manifest);
    this.materials = applyGLBCrownMaterials(loaded.scene, quality, renderer);
    this.shell = this.bindings.shell as THREE.Group;
    this.core = this.bindings.core;
    this.rings = this.bindings.rings;
    this.root.name = `GLBDigitalCrown_${lod}`;
    this.bindings.authoredRoot.removeFromParent();
    const bounds = loaded.metrics.bounds;
    const height = Math.max(0.001, bounds.getSize(new THREE.Vector3()).y);
    this.bindings.authoredRoot.scale.multiplyScalar(3.15 / height);
    this.root.add(this.bindings.authoredRoot);

    const count = this.bindings.segments.length;
    this.motions = this.bindings.segments.map((object, index) => {
      const base = this.bindings.baseTransforms.get(object)!;
      const normalized = count <= 1 ? 0 : (index - (count - 1) / 2) / ((count - 1) / 2);
      const side = normalized === 0 ? 1 : Math.sign(normalized);
      const scatterPosition = base.position.clone().add(new THREE.Vector3(
        side * (1.35 + Math.abs(normalized) * 1.05),
        index % 2 ? 0.58 : -0.46,
        -2.2 - Math.abs(normalized) * 1.35,
      ));
      const scatterQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (index % 2 ? 1 : -1) * 0.16,
        normalized * 0.36,
        side * 0.2,
      )).multiply(base.quaternion);
      return {
        object,
        base,
        scatterPosition,
        scatterQuaternion,
        normalized,
        delay: Math.abs(normalized) * 0.12 + (index % 2) * 0.018,
      };
    });
    this.bindings.energyOrange && (this.bindings.energyOrange.visible = false);
    recordCrownAttach();
    this.diagnostics = {
      backend: "glb",
      lod,
      status: "ready",
      reason: "glb_ready",
      assetId: manifest.assetId,
      bytes: loaded.bytes,
      parseTime: Math.round(loaded.parseTime * 10) / 10,
      materials: this.materials.materials.length,
      textures: this.materials.textures.length,
      triangles: loaded.metrics.triangles,
      drawCalls: loaded.metrics.drawCalls,
      estimatedTextureMemory: this.materials.estimatedTextureMemory,
      transparentMaterials: this.materials.transparentMaterials,
      transmissionMaterials: this.materials.transmissionMaterials,
      substitutions: this.materials.substitutions,
      warnings: [],
      loader: getCrownLoaderCounters(),
    };
  }

  setAssemblyProgress(value: number) { this.assemblyProgress = clamp(value); }
  setOpenProgress(value: number) { this.openProgress = clamp(value); }
  setCoreIntensity(value: number) { this.coreIntensity = Math.max(0, value); }
  setPortalProgress(value: number) { this.portalProgress = clamp(value); }

  update(_deltaTime: number, state: CrownVisualState) {
    const assemblySignal = state.reducedMotion ? 1 : 0.36 + this.assemblyProgress * 0.64;
    for (const motion of this.motions) {
      const local = smootherstep(clamp((assemblySignal - motion.delay) / 0.64));
      restoreTransform(motion.object, motion.base);
      motion.object.position.lerpVectors(motion.scatterPosition, motion.base.position, local);
      motion.object.quaternion.copy(motion.scatterQuaternion).slerp(motion.base.quaternion, local);
      const side = motion.normalized === 0 ? 0 : Math.sign(motion.normalized);
      const centerLift = 1 - Math.min(1, Math.abs(motion.normalized) * 2.4);
      motion.object.position.x += side * this.openProgress * (0.25 + Math.abs(motion.normalized) * 0.34);
      motion.object.position.y += centerLift * this.openProgress * 0.78 + this.openProgress * 0.06;
      motion.object.position.z -= this.openProgress * (0.28 + centerLift * 0.24);
      const openRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-centerLift * this.openProgress * 0.1, side * this.openProgress * 0.21, 0));
      motion.object.quaternion.multiply(openRotation);
    }

    for (const [index, spire] of this.bindings.spires.entries()) {
      const base = this.bindings.baseTransforms.get(spire)!;
      restoreTransform(spire, base);
      const center = 1 - Math.abs((index - (this.bindings.spires.length - 1) / 2) / Math.max(1, (this.bindings.spires.length - 1) / 2));
      spire.position.y += this.openProgress * (0.08 + center * 0.15);
    }

    this.root.rotation.set(
      -0.025 + state.open * 0.025,
      -0.07 + state.inspection * 0.13 - state.portal * 0.06 + (state.reducedMotion ? 0 : Math.sin(state.elapsedSeconds * 0.3) * 0.018 * state.idleAmount),
      state.reducedMotion ? 0 : Math.sin(state.elapsedSeconds * 0.18) * 0.006,
    );

    const coreBase = this.bindings.baseTransforms.get(this.core)!;
    restoreTransform(this.core, coreBase);
    const coreScale = 0.74 + this.coreIntensity * 0.16 - this.portalProgress * 0.12;
    this.core.scale.multiplyScalar(coreScale);
    this.rings.forEach((ring, index) => {
      const base = this.bindings.baseTransforms.get(ring)!;
      restoreTransform(ring, base);
      ring.scale.multiplyScalar(0.92 + this.openProgress * (0.12 + index * 0.04));
      if (!state.reducedMotion) ring.rotateZ(state.elapsedSeconds * (index % 2 ? -0.045 : 0.035) + index * 0.62);
    });

    const portalBase = this.bindings.baseTransforms.get(this.bindings.portal)!;
    restoreTransform(this.bindings.portal, portalBase);
    this.bindings.portal.visible = this.portalProgress > 0.001;
    this.bindings.portal.scale.multiplyScalar(Math.max(0.001, this.portalProgress * (0.72 + state.enter * 0.36)));
    const orangeMix = smoothstep(clamp((state.tacticalOrange - 0.18) / 0.5));
    if (this.bindings.energyCyan) this.bindings.energyCyan.visible = orangeMix < 0.99;
    if (this.bindings.energyOrange) this.bindings.energyOrange.visible = orangeMix > 0.01;
    for (const material of this.materials.cyan) {
      material.emissive.copy(CYAN);
      material.emissiveIntensity = 0.38 + this.coreIntensity * 0.22;
      material.opacity = 0.86 * (1 - orangeMix * 0.32);
    }
    for (const material of [...this.materials.orange, ...this.materials.portal]) {
      material.emissive.copy(ORANGE);
      material.emissiveIntensity = 0.2 + orangeMix * 0.58 + this.portalProgress * 0.18;
      material.opacity = 0.08 + orangeMix * 0.78;
    }
    for (const material of this.materials.coreEnergy) material.emissiveIntensity = 0.62 + this.coreIntensity * 1.15;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.root.removeFromParent();
    this.root.clear();
    this.materials.dispose();
    this.loaded.lease.release();
  }
}
