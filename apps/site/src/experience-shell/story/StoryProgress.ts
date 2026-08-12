import { clamp, inverseLerp, smoothstep } from "../../experience/core/math";
import { EXPERIENCE_CHAPTERS, type ExperienceChapterConfig, type ExperienceChapterId } from "../experienceShellConfig";

export type StoryProgressSnapshot = {
  chapter: ExperienceChapterConfig;
  chapterId: ExperienceChapterId;
  localProgress: number;
};

export function getStoryProgress(progress: number): StoryProgressSnapshot {
  const normalized = clamp(progress);
  const chapter = EXPERIENCE_CHAPTERS.find((candidate, index) =>
    index === EXPERIENCE_CHAPTERS.length - 1
      ? normalized >= candidate.range[0] && normalized <= candidate.range[1]
      : normalized >= candidate.range[0] && normalized < candidate.range[1],
  ) ?? EXPERIENCE_CHAPTERS[0];
  return {
    chapter,
    chapterId: chapter.id,
    localProgress: inverseLerp(chapter.range[0], chapter.range[1], normalized),
  };
}

export function getTransitionProgress(progress: number, range: readonly [number, number]) {
  return smoothstep(inverseLerp(range[0], range[1], clamp(progress)));
}

export function getChapterTargetProgress(chapterId: ExperienceChapterId) {
  const chapter = EXPERIENCE_CHAPTERS.find((candidate) => candidate.id === chapterId) ?? EXPERIENCE_CHAPTERS[0];
  const lead = Math.min(0.018, (chapter.range[1] - chapter.range[0]) * 0.18);
  return clamp(chapter.range[0] + lead);
}

