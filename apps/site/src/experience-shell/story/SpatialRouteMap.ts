import { CHAPTER_BY_HASH, CHAPTER_BY_ID, type ExperienceChapterId } from "../experienceShellConfig";
import { getChapterTargetProgress } from "./StoryProgress";

export function chapterFromHash(hash: string): ExperienceChapterId | null {
  const key = hash.replace(/^#/, "").trim().toLowerCase();
  return CHAPTER_BY_HASH.get(key)?.id ?? null;
}

export function hashForChapter(chapterId: ExperienceChapterId) {
  return `#${CHAPTER_BY_ID.get(chapterId)?.hash ?? "crown"}`;
}

export function scrollTopForChapter(story: HTMLElement, chapterId: ExperienceChapterId, viewportHeight: number) {
  const storyTop = story.getBoundingClientRect().top + window.scrollY;
  const travel = Math.max(1, story.offsetHeight - viewportHeight);
  return storyTop + getChapterTargetProgress(chapterId) * travel;
}

