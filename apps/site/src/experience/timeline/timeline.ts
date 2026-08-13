import { clamp, smoothstep, smootherstep } from "../core/math";
import { getRangeProgress } from "../scroll/ScrollChapters";
import type { ExperienceTimelineState } from "../types";

export function evaluateExperienceTimeline(progress: number, reducedMotion = false): ExperienceTimelineState {
  const p = clamp(progress);
  const assembly = reducedMotion ? 1 : smootherstep(getRangeProgress(p, 0.055, 0.22));
  const inspectionIn = smoothstep(getRangeProgress(p, 0.18, 0.22));
  const inspectionOut = 1 - smoothstep(getRangeProgress(p, 0.285, 0.315));
  const transitOpen = smootherstep(getRangeProgress(p, 0.27, 0.35))
    * (1 - smoothstep(getRangeProgress(p, 0.39, 0.43)));
  const finalOpen = smootherstep(getRangeProgress(p, 0.965, 0.995));
  const open = reducedMotion
    ? Math.max(smoothstep(getRangeProgress(p, 0.29, 0.34)) * 0.35, finalOpen * 0.58)
    : Math.max(transitOpen, finalOpen);
  const crownPortal = smoothstep(getRangeProgress(p, 0.30, 0.43))
    * (1 - smoothstep(getRangeProgress(p, 0.44, 0.49)));
  const tacticalPortal = smoothstep(getRangeProgress(p, 0.60, 0.70))
    * (1 - smoothstep(getRangeProgress(p, 0.82, 0.87)));
  const finalPortal = smoothstep(getRangeProgress(p, 0.965, 1));
  const portal = Math.max(crownPortal, tacticalPortal, finalPortal);
  const ecosystem = smoothstep(getRangeProgress(p, 0.82, 0.91));
  const enter = smoothstep(getRangeProgress(p, 0.96, 1));
  const tacticalIn = smoothstep(getRangeProgress(p, 0.57, 0.70));
  const tacticalOut = 1 - smoothstep(getRangeProgress(p, 0.82, 0.87));
  const tacticalOrange = tacticalIn * tacticalOut;
  const awakening = smoothstep(getRangeProgress(p, 0.01, 0.08));
  const coreIntensity = 0.16
    + awakening * 0.32
    + assembly * 0.18
    + open * 0.46
    + tacticalOrange * 0.18
    + enter * 0.56;

  return {
    assembly,
    inspection: inspectionIn * inspectionOut,
    open,
    coreIntensity,
    portal,
    ecosystem,
    enter,
    tacticalOrange,
    idleAmount: reducedMotion ? 0 : 1 - Math.max(open, tacticalOrange) * 0.32,
  };
}
