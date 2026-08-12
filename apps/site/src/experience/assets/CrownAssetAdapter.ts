import type * as THREE from "three";
import type { BlackCrownExperienceQuality } from "../experienceConfig";
import type { CrownAssetRequest } from "./CrownBackendSelector";
import type { DeviceCapabilities } from "../quality/DeviceCapabilities";
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

export type CrownBackend = "procedural" | "glb";
export type CrownLOD = "low" | "medium" | "high";
export type CrownAssetReason =
  | "procedural_requested"
  | "manifest_disabled"
  | "asset_missing"
  | "fetch_failed"
  | "parse_failed"
  | "binding_failed"
  | "budget_failed"
  | "capability_fallback"
  | "performance_downgrade"
  | "glb_ready";

export type CrownLoaderCounters = {
  fetch: number;
  parse: number;
  attach: number;
  dispose: number;
  activeReferences: number;
};

export type CrownAssetDiagnostics = {
  backend: CrownBackend;
  lod: CrownLOD;
  status: "fallback" | "loading" | "ready";
  reason: CrownAssetReason;
  assetId: string;
  bytes: number;
  fetchTime: number;
  parseTime: number;
  bindTime: number;
  materials: number;
  textures: number;
  triangles: number;
  drawCalls: number;
  estimatedTextureMemory: number;
  transparentMaterials: number;
  transmissionMaterials: number;
  substitutions: string[];
  warnings: string[];
  loader: CrownLoaderCounters;
};

export type CrownAssetLoadOptions = {
  requestedMode: CrownAssetRequest;
  quality: BlackCrownExperienceQuality;
  resolvedQuality: CrownLOD;
  capabilities: DeviceCapabilities;
  renderer: THREE.WebGLRenderer;
  debug: boolean;
  signal: AbortSignal;
  preferredLod?: CrownLOD;
};

export type CrownLoadResult = {
  backend: CrownBackend;
  visual: CrownVisual;
  lod: CrownLOD;
  diagnostics: CrownAssetDiagnostics;
};

export interface CrownAssetAdapter {
  load(options: CrownAssetLoadOptions): Promise<CrownLoadResult>;
  dispose(): void;
}

export function createProceduralDiagnostics(
  lod: CrownLOD,
  reason: CrownAssetReason,
  loader: CrownLoaderCounters = { fetch: 0, parse: 0, attach: 0, dispose: 0, activeReferences: 0 },
): CrownAssetDiagnostics {
  return {
    backend: "procedural",
    lod,
    status: "fallback",
    reason,
    assetId: "procedural-digital-crown-v2",
    bytes: 0,
    fetchTime: 0,
    parseTime: 0,
    bindTime: 0,
    materials: 0,
    textures: 0,
    triangles: 0,
    drawCalls: 0,
    estimatedTextureMemory: 0,
    transparentMaterials: 0,
    transmissionMaterials: 0,
    substitutions: [],
    warnings: [],
    loader: { ...loader },
  };
}

// A future GLB adapter must return this interface; the timeline never addresses mesh names directly.
export function assertCrownVisual(value: CrownVisual) {
  return value;
}
