import type { ExperienceScene } from "../core/SceneRegistry";

export type ExperienceTransition = {
  id: string;
  evaluate(amount: number, from: ExperienceScene, to: ExperienceScene, reducedMotion: boolean): void;
};

