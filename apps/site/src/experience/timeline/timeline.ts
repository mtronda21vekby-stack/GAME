import { clamp, smoothstep, smootherstep } from "../core/math";
import { getRangeProgress } from "../scroll/ScrollChapters";
import type { ExperienceTimelineState } from "../types";

export function evaluateExperienceTimeline(progress: number, reducedMotion = false): ExperienceTimelineState {
  const p = clamp(progress);
  const assembly = reducedMotion ? 1 : smootherstep(getRangeProgress(p, 0.035, 0.15));
  const open = reducedMotion ? smoothstep(getRangeProgress(p, 0.19, 0.28)) * 0.58 : smootherstep(getRangeProgress(p, 0.18, 0.3));
  const portal = smoothstep(getRangeProgress(p, 0.19, 0.34));
  const ecosystem = smoothstep(getRangeProgress(p, 0.65, 0.79));
  const enter = smoothstep(getRangeProgress(p, 0.9, 1));
  const inspectionIn = smoothstep(getRangeProgress(p, 0.055, 0.09));
  const inspectionOut = 1 - smoothstep(getRangeProgress(p, 0.19, 0.23));

  return {
    assembly,
    inspection: inspectionIn * inspectionOut,
    open,
    coreIntensity: 0.22 + smoothstep(getRangeProgress(p, 0.02, 0.12)) * 0.35 + open * 0.5 + enter * 0.42,
    portal,
    ecosystem,
    enter,
    tacticalOrange: smoothstep(getRangeProgress(p, 0.49, 0.56)) * (1 - smoothstep(getRangeProgress(p, 0.67, 0.73))),
    idleAmount: reducedMotion ? 0 : 1 - open * 0.35,
  };
}
