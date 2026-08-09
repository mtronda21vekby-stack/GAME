export type BlackCrownExperienceMode = "off" | "lab" | "home";
export type BlackCrownExperienceQuality = "auto" | "low" | "medium" | "high";

function parseMode(value: unknown): BlackCrownExperienceMode {
  return value === "lab" || value === "home" ? value : "off";
}

function parseQuality(value: unknown): BlackCrownExperienceQuality {
  return value === "low" || value === "medium" || value === "high" ? value : "auto";
}

export const experienceConfig = Object.freeze({
  mode: parseMode(import.meta.env.VITE_BC_EXPERIENCE_MODE),
  debug: import.meta.env.VITE_BC_EXPERIENCE_DEBUG === "1",
  quality: parseQuality(import.meta.env.VITE_BC_EXPERIENCE_QUALITY),
});

export function isNexusRouteEnabled(mode = experienceConfig.mode) {
  return mode === "lab" || mode === "home";
}
