import type { QualityTier } from "../types";

export type QualityPreset = {
  tier: QualityTier;
  dprCap: number;
  particles: number;
  foregroundParticles: number;
  ecosystemNodes: number;
  radialSegments: number;
  antialias: boolean;
};

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  low: { tier: "low", dprCap: 1, particles: 130, foregroundParticles: 28, ecosystemNodes: 4, radialSegments: 28, antialias: false },
  medium: { tier: "medium", dprCap: 1.25, particles: 260, foregroundParticles: 54, ecosystemNodes: 6, radialSegments: 42, antialias: true },
  high: { tier: "high", dprCap: 1.5, particles: 420, foregroundParticles: 82, ecosystemNodes: 8, radialSegments: 56, antialias: true },
};
