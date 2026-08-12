export type BlackCrownExperienceMode = "off" | "lab" | "home";
export type BlackCrownExperienceQuality = "auto" | "low" | "medium" | "high";
export type BlackCrownCrownAssetMode = "auto" | "procedural" | "glb";
export type BlackCrownCrownAssetOverride = "candidate-a" | "candidate-b" | null;
export type BlackCrownCrownReviewSelection = "procedural" | Exclude<BlackCrownCrownAssetOverride, null>;
export type BlackCrownEnvironmentAssetMode = "procedural" | "blender";

function parseMode(value: unknown): BlackCrownExperienceMode {
  if (value === "off" || value === "lab" || value === "home") return value;
  return import.meta.env.PROD ? "home" : "off";
}

function parseQuality(value: unknown): BlackCrownExperienceQuality {
  return value === "low" || value === "medium" || value === "high" ? value : "auto";
}

function parseCrownAssetMode(value: unknown): BlackCrownCrownAssetMode {
  return value === "procedural" || value === "glb" ? value : "auto";
}

function parseCrownAssetOverride(value: unknown): BlackCrownCrownAssetOverride {
  if (value === "candidate-a" || value === "candidate-b") return value;
  return import.meta.env.PROD ? "candidate-b" : null;
}

function parseEnvironmentAssetMode(value: unknown): BlackCrownEnvironmentAssetMode {
  if (value === "procedural" || value === "blender") return value;
  return import.meta.env.PROD ? "blender" : "procedural";
}

export const experienceConfig = Object.freeze({
  mode: parseMode(import.meta.env.VITE_BC_EXPERIENCE_MODE),
  debug: import.meta.env.VITE_BC_EXPERIENCE_DEBUG === "1",
  quality: parseQuality(import.meta.env.VITE_BC_EXPERIENCE_QUALITY),
  crownAssetMode: parseCrownAssetMode(import.meta.env.VITE_BC_CROWN_ASSET_MODE),
  crownAssetOverride: parseCrownAssetOverride(import.meta.env.VITE_BC_CROWN_ASSET_OVERRIDE),
  environmentAssetMode: parseEnvironmentAssetMode(import.meta.env.VITE_BC_ENVIRONMENT_ASSET_MODE),
});

export function isNexusRouteEnabled(mode = experienceConfig.mode) {
  return mode === "lab" || mode === "home";
}
