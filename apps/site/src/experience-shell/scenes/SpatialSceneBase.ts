import * as THREE from "three";
import { disposeObject3D } from "../../experience/core/Lifecycle";
import { clamp } from "../../experience/core/math";
import type { QualityTier } from "../../experience/types";
import type { ExperienceScene } from "../core/SceneRegistry";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { ExperienceSceneId } from "../experienceShellConfig";

export abstract class SpatialSceneBase implements ExperienceScene {
  readonly root = new THREE.Group();
  protected readonly detail = new THREE.Group();
  private readonly opacity = new Map<THREE.Material, number>();
  protected quality: QualityTier = "low";

  constructor(readonly id: ExperienceSceneId) {
    this.root.name = `BlackCrownScene:${id}`;
    this.detail.name = `${id}:high-detail`;
    this.root.add(this.detail);
  }

  protected material<T extends THREE.Material>(material: T, baseOpacity = 1): T {
    material.transparent = true;
    material.opacity = baseOpacity;
    this.opacity.set(material, baseOpacity);
    return material;
  }

  protected solid<T extends THREE.Material>(material: T): T {
    material.transparent = false;
    material.opacity = 1;
    return material;
  }

  protected resetPose() {
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    this.root.scale.setScalar(1);
  }

  setActive(active: boolean) { this.root.visible = active; }

  setWeight(weight: number) {
    const normalized = clamp(weight);
    for (const [material, baseOpacity] of this.opacity) material.opacity = baseOpacity * normalized;
  }

  setQuality(tier: QualityTier) {
    if (this.quality === tier) return;
    this.quality = tier;
    this.detail.visible = tier !== "low";
  }

  abstract evaluate(snapshot: SceneEvaluationSnapshot): void;

  dispose() {
    disposeObject3D(this.root);
    this.opacity.clear();
  }
}

export function metalMaterial(color: number, emissive = 0x06151a, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.12,
    metalness: 0.72,
    roughness: 0.52,
    transparent: true,
    opacity,
  });
}

export function energyMaterial(color: number, opacity = 0.72) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
