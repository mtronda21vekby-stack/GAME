import {
  experienceConfig,
  type BlackCrownCrownAssetMode,
  type BlackCrownCrownAssetOverride,
  type BlackCrownExperienceMode,
} from "../experienceConfig";
import type { DeviceCapabilities } from "../quality/DeviceCapabilities";
import type { QualityTier } from "../types";
import type { CrownAssetManifest } from "./CrownAssetManifest";
import type { CrownLOD } from "./CrownAssetAdapter";

export type CrownAssetRequest = BlackCrownCrownAssetMode | "fixture" | "candidate-a" | "candidate-b";

export function readCrownAssetRequest(
  configured: BlackCrownCrownAssetMode,
  debug: boolean,
  search = window.location.search,
  configuredOverride: BlackCrownCrownAssetOverride = experienceConfig.crownAssetOverride,
  experienceMode: BlackCrownExperienceMode = experienceConfig.mode,
): CrownAssetRequest {
  const parameters = new URLSearchParams(search);
  const candidate = parameters.get("nexuscrown");
  const candidateRouteEnabled = experienceMode === "lab" || experienceMode === "home";
  if (candidateRouteEnabled && (configuredOverride === "candidate-a" || configuredOverride === "candidate-b")) return configuredOverride;
  if (candidateRouteEnabled && (candidate === "candidate-a" || candidate === "candidate-b") && (debug || import.meta.env.DEV)) return candidate;
  const query = parameters.get("bcasset");
  if (query === "fixture") return debug || import.meta.env.DEV ? "fixture" : configured;
  if (query === "auto" || query === "procedural" || query === "glb") return query;
  return configured;
}

export function selectCrownLod(quality: QualityTier, capabilities: DeviceCapabilities): CrownLOD {
  if (capabilities.saveData || capabilities.reducedMotion || capabilities.weakProfile) return "low";
  if (quality === "high" && !capabilities.mobileViewport && !capabilities.coarsePointer) return "high";
  return quality === "low" ? "low" : "medium";
}

export function getLodFallbackOrder(preferred: CrownLOD): CrownLOD[] {
  return preferred === "high" ? ["high", "medium", "low"] : preferred === "medium" ? ["medium", "low"] : ["low"];
}

export function shouldAttemptGlb(request: CrownAssetRequest, manifest: CrownAssetManifest, capabilities: DeviceCapabilities) {
  if (request === "procedural") return false;
  if (!manifest.enabled) return false;
  if (!capabilities.webgl2 && (capabilities.saveData || capabilities.weakProfile)) return false;
  return request === "glb" || request === "fixture" || request === "candidate-a" || request === "candidate-b" || request === "auto";
}
