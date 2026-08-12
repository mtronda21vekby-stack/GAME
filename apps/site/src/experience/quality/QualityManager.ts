import type { BlackCrownExperienceQuality } from "../experienceConfig";
import type { QualityTier } from "../types";
import { readDeviceCapabilities } from "./DeviceCapabilities";
import { QUALITY_PRESETS, type QualityPreset } from "./qualityPresets";
import type { FrameSample } from "./FrameSampler";

export function selectAutoQuality(): QualityTier {
  const device = readDeviceCapabilities();
  if (device.reducedMotion || device.saveData || device.mobileViewport || device.coarsePointer) return "low";
  if ((device.memory !== null && device.memory <= 4) || device.cores <= 4) return "low";
  if ((device.memory !== null && device.memory >= 8) && device.cores >= 8) return "high";
  return "medium";
}

export class QualityManager {
  private requested: BlackCrownExperienceQuality;
  private tier: QualityTier;
  private automaticDowngradeUsed = false;

  constructor(requested: BlackCrownExperienceQuality) {
    this.requested = requested;
    this.tier = requested === "auto" ? selectAutoQuality() : requested;
  }

  get preset(): QualityPreset {
    return QUALITY_PRESETS[this.tier];
  }

  setRequested(requested: BlackCrownExperienceQuality) {
    this.requested = requested;
    this.tier = requested === "auto" ? selectAutoQuality() : requested;
    return this.preset;
  }

  get requestedQuality() {
    return this.requested;
  }

  considerAutomaticDowngrade(sample: FrameSample): QualityPreset | null {
    if (this.requested !== "auto" || this.automaticDowngradeUsed || !sample.complete) return null;
    const sustained = sample.p95 > 29 || sample.repeatedSlowFrames >= Math.max(4, Math.ceil(sample.count * 0.04));
    if (!sustained || this.tier === "low") return null;
    this.automaticDowngradeUsed = true;
    this.tier = this.tier === "high" ? "medium" : "low";
    return this.preset;
  }
}
