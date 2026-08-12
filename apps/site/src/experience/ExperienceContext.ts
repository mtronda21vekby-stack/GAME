import React from "react";
import type { BlackCrownCrownReviewSelection, BlackCrownExperienceQuality } from "./experienceConfig";
import type { ExperienceBootStage, ExperienceMetrics, ScrollSnapshot } from "./types";

export type ExperienceRuntimeControl = {
  setQuality: (quality: BlackCrownExperienceQuality) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetPerformanceSample: () => void;
  setCrownAsset: (asset: BlackCrownCrownReviewSelection) => void;
  dispose: () => void;
};

export type ExperienceContextValue = {
  canvasHostRef: React.RefObject<HTMLDivElement>;
  storyRef: React.RefObject<HTMLElement>;
  snapshot: ScrollSnapshot;
  metrics: ExperienceMetrics;
  bootStage: ExperienceBootStage;
  entered: boolean;
  soundEnabled: boolean;
  requestedQuality: BlackCrownExperienceQuality;
  webglAvailable: boolean;
  setRuntime: (runtime: ExperienceRuntimeControl | null) => void;
  setSnapshot: (snapshot: ScrollSnapshot) => void;
  setMetrics: (metrics: ExperienceMetrics) => void;
  setBootStage: (stage: ExperienceBootStage) => void;
  setWebglAvailable: (available: boolean) => void;
  enter: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setRequestedQuality: (quality: BlackCrownExperienceQuality) => void;
  resetPerformanceSample: () => void;
  setCrownAsset: (asset: BlackCrownCrownReviewSelection) => void;
};

export const ExperienceContext = React.createContext<ExperienceContextValue | null>(null);

export function useExperience() {
  const value = React.useContext(ExperienceContext);
  if (!value) throw new Error("useExperience must be used inside ExperienceProvider");
  return value;
}
