import type { BlackCrownExperienceQuality } from "./experienceConfig";

export const SCROLL_CHAPTER_IDS = [
  "awakening",
  "assembly",
  "inspection",
  "core-reveal",
  "crown-front",
  "ecosystem",
  "enter",
] as const;

export type ScrollChapterId = (typeof SCROLL_CHAPTER_IDS)[number];
export type ScrollDirection = -1 | 0 | 1;
export type QualityTier = Exclude<BlackCrownExperienceQuality, "auto">;

export type ScrollSnapshot = {
  targetProgress: number;
  progress: number;
  previousProgress: number;
  velocity: number;
  direction: ScrollDirection;
  chapterId: ScrollChapterId;
  chapterProgress: number;
  viewportWidth: number;
  viewportHeight: number;
  reducedMotion: boolean;
};

export type ExperienceBootStage = "idle" | "renderer" | "scene" | "geometry" | "materials" | "first-frame" | "ready" | "fallback" | "error";

export type ExperienceMetrics = {
  fps: number;
  frameTime: number;
  dpr: number;
  quality: QualityTier;
  drawCalls: number;
  triangles: number;
  renderer: string;
  contextState: "ready" | "lost" | "fallback";
};

export type ExperienceTimelineState = {
  assembly: number;
  inspection: number;
  open: number;
  coreIntensity: number;
  portal: number;
  ecosystem: number;
  enter: number;
  tacticalOrange: number;
  idleAmount: number;
};

export const INITIAL_SCROLL_SNAPSHOT: ScrollSnapshot = {
  targetProgress: 0,
  progress: 0,
  previousProgress: 0,
  velocity: 0,
  direction: 0,
  chapterId: "awakening",
  chapterProgress: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  reducedMotion: false,
};

export const INITIAL_EXPERIENCE_METRICS: ExperienceMetrics = {
  fps: 0,
  frameTime: 0,
  dpr: 1,
  quality: "low",
  drawCalls: 0,
  triangles: 0,
  renderer: "pending",
  contextState: "ready",
};
