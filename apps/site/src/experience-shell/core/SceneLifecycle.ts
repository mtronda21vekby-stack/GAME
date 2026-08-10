import type { QualityTier } from "../../experience/types";
import { clamp, inverseLerp } from "../../experience/core/math";
import {
  EXPERIENCE_CHAPTERS,
  EXPERIENCE_TRANSITION_RANGES,
  type ExperienceSceneId,
} from "../experienceShellConfig";
import { getStoryProgress, getTransitionProgress } from "../story/StoryProgress";

export type SceneEvaluationSnapshot = {
  globalProgress: number;
  localProgress: number;
  weight: number;
  elapsedSeconds: number;
  reducedMotion: boolean;
  quality: QualityTier;
};

export type SceneTransitionState = {
  id: string;
  from: ExperienceSceneId;
  to: ExperienceSceneId;
  amount: number;
};

export type SceneLifecycleSnapshot = {
  primary: ExperienceSceneId;
  partner: ExperienceSceneId | null;
  activeSceneIds: readonly ExperienceSceneId[];
  weights: ReadonlyMap<ExperienceSceneId, number>;
  transition: SceneTransitionState | null;
};

const TRANSITIONS = [
  { id: "crown-to-gate", from: "crown-chamber", to: "world-gate", range: EXPERIENCE_TRANSITION_RANGES.crownToGate },
  { id: "gate-to-ocean", from: "world-gate", to: "evofish-abyss", range: EXPERIENCE_TRANSITION_RANGES.gateToOcean },
  { id: "ocean-to-reactor", from: "evofish-abyss", to: "crown-front-reactor", range: EXPERIENCE_TRANSITION_RANGES.oceanToReactor },
  { id: "reactor-to-network", from: "crown-front-reactor", to: "network-core", range: EXPERIENCE_TRANSITION_RANGES.reactorToNetwork },
  { id: "network-to-vault", from: "network-core", to: "collection-vault", range: EXPERIENCE_TRANSITION_RANGES.networkToVault },
  { id: "vault-to-identity", from: "collection-vault", to: "identity", range: EXPERIENCE_TRANSITION_RANGES.vaultToIdentity },
] as const;

export function getSceneLocalProgress(sceneId: ExperienceSceneId, progress: number) {
  const chapter = EXPERIENCE_CHAPTERS.find((candidate) => candidate.sceneId === sceneId && candidate.id !== "boot")
    ?? EXPERIENCE_CHAPTERS.find((candidate) => candidate.sceneId === sceneId)
    ?? EXPERIENCE_CHAPTERS[0];
  return inverseLerp(chapter.range[0], chapter.range[1], clamp(progress));
}

export function resolveSceneLifecycle(progress: number): SceneLifecycleSnapshot {
  const normalized = clamp(progress);
  const story = getStoryProgress(normalized);
  const transition = TRANSITIONS.find((candidate) => normalized >= candidate.range[0] && normalized <= candidate.range[1]);
  if (!transition) {
    const weights = new Map<ExperienceSceneId, number>([[story.chapter.sceneId, 1]]);
    return { primary: story.chapter.sceneId, partner: null, activeSceneIds: [story.chapter.sceneId], weights, transition: null };
  }

  const amount = getTransitionProgress(normalized, transition.range);
  const weights = new Map<ExperienceSceneId, number>([
    [transition.from, 1 - amount],
    [transition.to, amount],
  ]);
  const primary = amount < 0.5 ? transition.from : transition.to;
  const partner = amount < 0.5 ? transition.to : transition.from;
  return {
    primary,
    partner,
    activeSceneIds: [primary, partner],
    weights,
    transition: { id: transition.id, from: transition.from, to: transition.to, amount },
  };
}

