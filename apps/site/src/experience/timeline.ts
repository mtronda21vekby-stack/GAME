import type { SceneId } from "./types";

export type TimelineRange = {
  id: SceneId;
  enter: number;
  holdStart: number;
  holdEnd: number;
  exit: number;
};

export const CINEMATIC_TIMELINE: readonly TimelineRange[] = [
  { id: "crown", enter: 0, holdStart: 0, holdEnd: 0.13, exit: 0.25 },
  { id: "gate", enter: 0.13, holdStart: 0.21, holdEnd: 0.31, exit: 0.42 },
  { id: "evofish", enter: 0.32, holdStart: 0.41, holdEnd: 0.52, exit: 0.64 },
  { id: "crown-front", enter: 0.54, holdStart: 0.63, holdEnd: 0.73, exit: 0.84 },
  { id: "network", enter: 0.74, holdStart: 0.84, holdEnd: 1, exit: 1 },
] as const;

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(value: number) {
  const next = clamp01(value);
  return next * next * (3 - 2 * next);
}

export function rangeProgress(progress: number, start: number, end: number) {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

export function rangeOpacity(progress: number, range: TimelineRange) {
  const fadeIn = smoothstep(rangeProgress(progress, range.enter, range.holdStart));
  if (progress <= range.holdEnd) return fadeIn;
  if (range.exit <= range.holdEnd) return 1;
  return 1 - smoothstep(rangeProgress(progress, range.holdEnd, range.exit));
}

export function localSceneProgress(progress: number, range: TimelineRange) {
  return smoothstep(rangeProgress(progress, range.enter, range.exit));
}

export function getActiveScene(progress: number): SceneId {
  let active = CINEMATIC_TIMELINE[0];
  let highestOpacity = -1;
  for (const range of CINEMATIC_TIMELINE) {
    const opacity = rangeOpacity(progress, range);
    if (opacity > highestOpacity || (opacity === highestOpacity && progress >= range.holdStart)) {
      active = range;
      highestOpacity = opacity;
    }
  }
  return active.id;
}

export function getTimelineVariables(progress: number) {
  const variables: Record<string, string> = { "--cx-progress": clamp01(progress).toFixed(4) };
  for (const range of CINEMATIC_TIMELINE) {
    const local = localSceneProgress(progress, range);
    const opacity = rangeOpacity(progress, range);
    const copyRange: TimelineRange = {
      ...range,
      enter: Math.min(range.holdStart, range.enter + 0.025),
      exit: Math.max(range.holdEnd, range.exit - 0.025),
    };
    variables[`--cx-${range.id}-opacity`] = opacity.toFixed(4);
    variables[`--cx-${range.id}-copy`] = rangeOpacity(progress, copyRange).toFixed(4);
    variables[`--cx-${range.id}-local`] = local.toFixed(4);
    variables[`--cx-${range.id}-shift`] = `${((0.5 - local) * 96).toFixed(2)}px`;
    variables[`--cx-${range.id}-scale`] = (0.96 + local * 0.1).toFixed(4);
    variables[`--cx-${range.id}-depth`] = `${(local * 160).toFixed(2)}px`;
  }
  return variables;
}
