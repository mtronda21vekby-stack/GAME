import type * as THREE from "three";
import type { ExperienceTimelineState } from "../types";

export type CrownVisualState = ExperienceTimelineState & {
  elapsedSeconds: number;
  reducedMotion: boolean;
};

export interface CrownVisual {
  root: THREE.Group;
  shell: THREE.Group;
  core: THREE.Object3D;
  rings: THREE.Object3D[];
  setAssemblyProgress(value: number): void;
  setOpenProgress(value: number): void;
  setCoreIntensity(value: number): void;
  setPortalProgress(value: number): void;
  update(deltaTime: number, state: CrownVisualState): void;
  dispose(): void;
}

export type CrownAssetFactory = () => CrownVisual;

// A future GLB adapter must return this interface; the timeline never addresses mesh names directly.
export function assertCrownVisual(value: CrownVisual) {
  return value;
}
