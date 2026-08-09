export type BlackCrownExperienceMode = "off" | "lab" | "home";
export type BlackCrownExperienceQuality = "auto" | "low" | "medium" | "high";
export type BlackCrownCrownAssetMode = "auto" | "procedural" | "glb";
export type BlackCrownCrownAssetOverride = "candidate-a" | null;

function parseMode(value: unknown): BlackCrownExperienceMode {
  return value === "lab" || value === "home" ? value : "off";
}

function parseQuality(value: unknown): BlackCrownExperienceQuality {
  return value === "low" || value === "medium" || value === "high" ? value : "auto";
}

function parseCrownAssetMode(value: unknown): BlackCrownCrownAssetMode {
  return value === "procedural" || value === "glb" ? value : "auto";
}

function parseCrownAssetOverride(value: unknown): BlackCrownCrownAssetOverride {
  return value === "candidate-a" ? value : null;
}

export const experienceConfig = Object.freeze({
  mode: parseMode(import.meta.env.VITE_BC_EXPERIENCE_MODE),
  debug: import.meta.env.VITE_BC_EXPERIENCE_DEBUG === "1",
  quality: parseQuality(import.meta.env.VITE_BC_EXPERIENCE_QUALITY),
  crownAssetMode: parseCrownAssetMode(import.meta.env.VITE_BC_CROWN_ASSET_MODE),
  crownAssetOverride: parseCrownAssetOverride(import.meta.env.VITE_BC_CROWN_ASSET_OVERRIDE),
});

export function isNexusRouteEnabled(mode = experienceConfig.mode) {
  return mode === "lab" || mode === "home";
}
