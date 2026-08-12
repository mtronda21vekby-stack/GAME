import { clamp, damp } from "../core/math";
import { getChapterAtProgress } from "./ScrollChapters";
import { getScrollDirection, normalizeScrollVelocity, smoothScrollProgress } from "./ScrollSmoothing";
import type { ScrollSnapshot } from "../types";

type ScrollDirectorOptions = {
  story: HTMLElement;
  onInput: () => void;
};

export class ScrollDirector {
  private readonly story: HTMLElement;
  private readonly onInput: () => void;
  private readonly reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private targetProgress = 0;
  private progress = 0;
  private velocity = 0;
  private viewportWidth = window.innerWidth;
  private viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
  private disposed = false;

  constructor({ story, onInput }: ScrollDirectorOptions) {
    this.story = story;
    this.onInput = onInput;
    this.measure();
    window.addEventListener("scroll", this.handleInput, { passive: true });
    window.addEventListener("resize", this.handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", this.handleResize, { passive: true });
    this.reducedMotionQuery.addEventListener("change", this.handleInput);
  }

  private handleInput = () => {
    if (this.disposed) return;
    this.measure();
    this.onInput();
  };

  private handleResize = () => {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
    this.handleInput();
  };

  private measure() {
    const rect = this.story.getBoundingClientRect();
    const travel = Math.max(1, this.story.offsetHeight - this.viewportHeight);
    this.targetProgress = clamp(-rect.top / travel);
  }

  update(deltaSeconds: number): ScrollSnapshot {
    const previousProgress = this.progress;
    this.progress = smoothScrollProgress(this.progress, this.targetProgress, deltaSeconds, this.reducedMotionQuery.matches);
    const rawVelocity = normalizeScrollVelocity(previousProgress, this.progress, deltaSeconds);
    this.velocity = damp(this.velocity, rawVelocity, 12, deltaSeconds);
    const chapter = getChapterAtProgress(this.progress);

    return {
      targetProgress: this.targetProgress,
      progress: this.progress,
      previousProgress,
      velocity: this.velocity,
      direction: getScrollDirection(this.velocity),
      chapterId: chapter.chapterId,
      chapterProgress: chapter.chapterProgress,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      reducedMotion: this.reducedMotionQuery.matches,
    };
  }

  isSettled() {
    return Math.abs(this.targetProgress - this.progress) < 0.0001 && Math.abs(this.velocity) < 0.0005;
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("scroll", this.handleInput);
    window.removeEventListener("resize", this.handleResize);
    window.visualViewport?.removeEventListener("resize", this.handleResize);
    this.reducedMotionQuery.removeEventListener("change", this.handleInput);
  }
}
