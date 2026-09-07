import { clamp, smoothstep, smootherstep } from "../core/math";
import { getRangeProgress } from "../scroll/ScrollChapters";
import type { ExperienceTimelineState } from "../types";
import { EXPERIENCE_PHASE_RANGES } from "../../experience-shell/experienceShellConfig";

export function evaluateExperienceTimeline(progress: number, reducedMotion = false): ExperienceTimelineState {
  const p = clamp(progress);
  const assembly = reducedMotion ? 1 : smootherstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.nanoAssembly));
  const inspectionIn = smoothstep(getRangeProgress(p, 0.18, EXPERIENCE_PHASE_RANGES.blackcrownHero[0]));
  const inspectionOut = 1 - smoothstep(getRangeProgress(p, 0.285, EXPERIENCE_PHASE_RANGES.blackcrownHero[1]));
  const transitOpen = smootherstep(getRangeProgress(p, EXPERIENCE_PHASE_RANGES.crownToOcean[0], 0.365))
    * (1 - smoothstep(getRangeProgress(p, 0.39, EXPERIENCE_PHASE_RANGES.crownToOcean[1])));
  const finalOpen = smootherstep(getRangeProgress(p, EXPERIENCE_PHASE_RANGES.finalCrownPass[0], 0.995));
  const open = reducedMotion
    ? Math.max(smoothstep(getRangeProgress(p, EXPERIENCE_PHASE_RANGES.crownToOcean[0], 0.35)) * 0.35, finalOpen * 0.58)
    : Math.max(transitOpen, finalOpen);
  const crownPortal = smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.crownToOcean))
    * (1 - smoothstep(getRangeProgress(p, 0.44, 0.49)));
  const tacticalPortal = smoothstep(getRangeProgress(p, 0.60, EXPERIENCE_PHASE_RANGES.oceanToVault[1]))
    * (1 - smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.vaultToNetwork)));
  const finalPortal = smoothstep(getRangeProgress(p, EXPERIENCE_PHASE_RANGES.finalCrownPass[0], 1));
  const portal = Math.max(crownPortal, tacticalPortal, finalPortal);
  const ecosystem = smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.vaultToNetwork));
  const enter = smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.finalCrownPass));
  const tacticalIn = smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.oceanToVault));
  const tacticalOut = 1 - smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.vaultToNetwork));
  const tacticalOrange = tacticalIn * tacticalOut;
  const awakening = smoothstep(getRangeProgress(p, ...EXPERIENCE_PHASE_RANGES.coreAwakening));
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
