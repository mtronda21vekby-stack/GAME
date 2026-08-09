import { clamp, smoothstep, smootherstep } from "../core/math";
import { getRangeProgress } from "../scroll/ScrollChapters";
import type { ExperienceTimelineState } from "../types";

export function evaluateExperienceTimeline(progress: number, reducedMotion = false): ExperienceTimelineState {
  const p = clamp(progress);
  const assembly = reducedMotion ? 1 : smootherstep(getRangeProgress(p, 0.1, 0.3));
  const open = reducedMotion ? smoothstep(getRangeProgress(p, 0.46, 0.56)) * 0.58 : smootherstep(getRangeProgress(p, 0.45, 0.62));
  const portal = smoothstep(getRangeProgress(p, 0.6, 0.78));
  const ecosystem = smoothstep(getRangeProgress(p, 0.76, 0.9));
  const enter = smoothstep(getRangeProgress(p, 0.9, 1));
  const inspectionIn = smoothstep(getRangeProgress(p, 0.28, 0.34));
  const inspectionOut = 1 - smoothstep(getRangeProgress(p, 0.43, 0.49));

  return {
    assembly,
    inspection: inspectionIn * inspectionOut,
    open,
    coreIntensity: 0.22 + smoothstep(getRangeProgress(p, 0.02, 0.12)) * 0.35 + open * 0.55 + portal * 0.4,
    portal,
    ecosystem,
    enter,
    tacticalOrange: smoothstep(getRangeProgress(p, 0.62, 0.72)) * (1 - smoothstep(getRangeProgress(p, 0.8, 0.88))),
    idleAmount: reducedMotion ? 0 : 1 - open * 0.35,
  };
}
