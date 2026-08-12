import { EXPERIENCE_CHAPTERS } from "../../experience-shell/experienceShellConfig";
import type { ScrollChapterId } from "../types";
import { clamp, inverseLerp } from "../core/math";

export type ScrollChapter = {
  id: ScrollChapterId;
  start: number;
  end: number;
};

export const SCROLL_CHAPTERS: readonly ScrollChapter[] = EXPERIENCE_CHAPTERS.map((chapter) => ({
  id: chapter.id,
  start: chapter.range[0],
  end: chapter.range[1],
}));

export function getChapterAtProgress(progress: number) {
  const normalized = clamp(progress);
  const chapter = SCROLL_CHAPTERS.find((candidate, index) =>
    index === SCROLL_CHAPTERS.length - 1
      ? normalized >= candidate.start && normalized <= candidate.end
      : normalized >= candidate.start && normalized < candidate.end,
  ) ?? SCROLL_CHAPTERS[0];
  return {
    chapterId: chapter.id,
    chapterProgress: inverseLerp(chapter.start, chapter.end, normalized),
  };
}

export function getRangeProgress(progress: number, start: number, end: number) {
  return inverseLerp(start, end, progress);
}
