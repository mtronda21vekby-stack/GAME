import type { ScrollChapterId } from "../types";
import { clamp, inverseLerp } from "../core/math";

export type ScrollChapter = {
  id: ScrollChapterId;
  start: number;
  end: number;
};

export const SCROLL_CHAPTERS: readonly ScrollChapter[] = [
  { id: "awakening", start: 0, end: 0.12 },
  { id: "assembly", start: 0.12, end: 0.3 },
  { id: "inspection", start: 0.3, end: 0.45 },
  { id: "core-reveal", start: 0.45, end: 0.62 },
  { id: "crown-front", start: 0.62, end: 0.78 },
  { id: "ecosystem", start: 0.78, end: 0.9 },
  { id: "enter", start: 0.9, end: 1 },
];

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
