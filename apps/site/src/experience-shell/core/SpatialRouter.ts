import type { ExperienceChapterId } from "../experienceShellConfig";
import { chapterFromHash, hashForChapter, scrollTopForChapter } from "../story/SpatialRouteMap";

export type SpatialRouterOptions = {
  story: HTMLElement;
  onNavigate?: (chapterId: ExperienceChapterId) => void;
};

export class SpatialRouter {
  private readonly story: HTMLElement;
  private readonly onNavigate?: (chapterId: ExperienceChapterId) => void;
  private disposed = false;

  constructor(options: SpatialRouterOptions) {
    this.story = options.story;
    this.onNavigate = options.onNavigate;
    document.addEventListener("click", this.handleClick);
    window.addEventListener("popstate", this.handleHistory);
    window.addEventListener("hashchange", this.handleHistory);
    window.requestAnimationFrame(() => this.syncFromLocation(false));
  }

  navigate(chapterId: ExperienceChapterId, historyMode: "push" | "replace" | "none" = "push") {
    if (this.disposed) return;
    const hash = hashForChapter(chapterId);
    if (historyMode === "push" && window.location.hash !== hash) window.history.pushState({ bcChapter: chapterId }, "", hash);
    if (historyMode === "replace" && window.location.hash !== hash) window.history.replaceState({ bcChapter: chapterId }, "", hash);
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    window.scrollTo({ top: scrollTopForChapter(this.story, chapterId, viewportHeight), behavior: "auto" });
    this.onNavigate?.(chapterId);
  }

  syncFromLocation(replaceUnknown: boolean) {
    const chapterId = chapterFromHash(window.location.hash);
    if (chapterId) this.navigate(chapterId, "none");
    else if (replaceUnknown && window.location.hash) this.navigate("crown-chamber", "replace");
  }

  private handleClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[data-bc-spatial-chapter]");
    if (!anchor) return;
    const chapterId = chapterFromHash(anchor.hash);
    if (!chapterId) return;
    event.preventDefault();
    this.navigate(chapterId);
  };

  private handleHistory = () => this.syncFromLocation(false);

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    document.removeEventListener("click", this.handleClick);
    window.removeEventListener("popstate", this.handleHistory);
    window.removeEventListener("hashchange", this.handleHistory);
  }
}

