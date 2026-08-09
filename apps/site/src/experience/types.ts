import type { BlackCrownExperienceQuality } from "./experienceConfig";
import type { CrownAssetReason, CrownBackend, CrownLOD, CrownLoaderCounters } from "./assets/CrownAssetAdapter";

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
  firstFrameTime: number;
  frameP50: number;
  frameP95: number;
  worstFrame: number;
  droppedFrames: number;
  dpr: number;
  quality: QualityTier;
  requestedQuality: BlackCrownExperienceQuality;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  renderer: string;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  contextState: "ready" | "lost" | "fallback";
  contextLostCount: number;
  routeEntryCount: number;
  routeDisposeCount: number;
  rafOwnerCount: number;
  crownBackend: CrownBackend;
  crownLod: CrownLOD;
  crownStatus: "fallback" | "loading" | "ready";
  crownReason: CrownAssetReason;
  crownAssetId: string;
  crownAssetBytes: number;
  crownFetchTime: number;
  crownParseTime: number;
  crownBindTime: number;
  crownFirstFrameTime: number;
  crownMaterials: number;
  crownTextures: number;
  crownTriangles: number;
  crownDrawCalls: number;
  estimatedTextureMemory: number;
  loader: CrownLoaderCounters;
  warnings: string[];
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
  firstFrameTime: 0,
  frameP50: 0,
  frameP95: 0,
  worstFrame: 0,
  droppedFrames: 0,
  dpr: 1,
  quality: "low",
  requestedQuality: "auto",
  drawCalls: 0,
  triangles: 0,
  textures: 0,
  geometries: 0,
  renderer: "pending",
  maxTextureSize: 0,
  maxRenderbufferSize: 0,
  contextState: "ready",
  contextLostCount: 0,
  routeEntryCount: 0,
  routeDisposeCount: 0,
  rafOwnerCount: 0,
  crownBackend: "procedural",
  crownLod: "low",
  crownStatus: "fallback",
  crownReason: "manifest_disabled",
  crownAssetId: "procedural-digital-crown-v2",
  crownAssetBytes: 0,
  crownFetchTime: 0,
  crownParseTime: 0,
  crownBindTime: 0,
  crownFirstFrameTime: 0,
  crownMaterials: 0,
  crownTextures: 0,
  crownTriangles: 0,
  crownDrawCalls: 0,
  estimatedTextureMemory: 0,
  loader: { fetch: 0, parse: 0, attach: 0, dispose: 0, activeReferences: 0 },
  warnings: [],
};
