import * as THREE from "three";
import type { QualityTier } from "../../experience/types";
import type { ExperienceSceneId } from "../experienceShellConfig";
import { getSceneLocalProgress, resolveSceneLifecycle, type SceneEvaluationSnapshot, type SceneLifecycleSnapshot } from "./SceneLifecycle";
import { TransitionDirector } from "./TransitionDirector";

export type ExperienceScene = {
  id: ExperienceSceneId;
  root: THREE.Group;
  preload?(): Promise<void>;
  evaluate(snapshot: SceneEvaluationSnapshot): void;
  setQuality(tier: QualityTier): void;
  setActive(active: boolean): void;
  setWeight(weight: number): void;
  dispose(): void;
};

export class SceneRegistry {
  private readonly scenes = new Map<ExperienceSceneId, ExperienceScene>();
  private readonly preloadStarted = new Set<ExperienceSceneId>();
  private readonly transitions = new TransitionDirector();
  private current: SceneLifecycleSnapshot = resolveSceneLifecycle(0);

  constructor(private readonly parent: THREE.Group, private readonly requestFrame: () => void) {}

  register(scene: ExperienceScene) {
    if (this.scenes.has(scene.id)) throw new Error(`Duplicate BlackCrown scene: ${scene.id}`);
    this.scenes.set(scene.id, scene);
    scene.root.visible = false;
    this.parent.add(scene.root);
  }

  evaluate(progress: number, elapsedSeconds: number, reducedMotion: boolean, quality: QualityTier) {
    this.current = resolveSceneLifecycle(progress);
    for (const scene of this.scenes.values()) {
      const weight = this.current.weights.get(scene.id) ?? 0;
      const active = weight > 0.001;
      scene.setActive(active);
      scene.setWeight(weight);
      scene.setQuality(quality);
      if (active) {
        scene.evaluate({
          globalProgress: progress,
          localProgress: getSceneLocalProgress(scene.id, progress),
          weight,
          elapsedSeconds,
          reducedMotion,
          quality,
        });
        this.preload(scene);
      }
    }
    this.transitions.evaluate(this.current, this.scenes, reducedMotion);
    return this.current;
  }

  private preload(scene: ExperienceScene) {
    if (!scene.preload || this.preloadStarted.has(scene.id)) return;
    this.preloadStarted.add(scene.id);
    void scene.preload().then(this.requestFrame).catch(this.requestFrame);
  }

  get(id: ExperienceSceneId) { return this.scenes.get(id); }
  get activeSceneCount() { return this.current.activeSceneIds.length; }
  get activeSceneIds() { return this.current.activeSceneIds; }

  dispose() {
    for (const scene of this.scenes.values()) scene.dispose();
    this.scenes.clear();
    this.preloadStarted.clear();
  }
}

