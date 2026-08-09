import React from "react";
import { getActiveScene, getTimelineVariables } from "./timeline";
import type { SceneId } from "./types";

type CinematicTimelineState = {
  activeScene: SceneId;
  reducedMotion: boolean;
};

export function useCinematicTimeline(rootRef: React.RefObject<HTMLElement>): CinematicTimelineState {
  const [activeScene, setActiveScene] = React.useState<SceneId>("crown");
  const [reducedMotion, setReducedMotionState] = React.useState(false);
  const activeSceneRef = React.useRef<SceneId>("crown");

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let rootTop = 0;
    let rootHeight = 0;
    let travel = 1;
    let isReduced = motionQuery.matches;

    const measure = () => {
      rootTop = root.getBoundingClientRect().top + window.scrollY;
      rootHeight = root.offsetHeight;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      travel = Math.max(1, rootHeight - viewportHeight);
    };

    const write = () => {
      frame = 0;
      if (isReduced) {
        root.dataset.progress = "reduced";
        root.dataset.phase = "all";
        return;
      }

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      if (window.scrollY + viewportHeight < rootTop || window.scrollY > rootTop + rootHeight) return;

      const progress = Math.max(0, Math.min(1, (window.scrollY - rootTop) / travel));
      for (const [property, value] of Object.entries(getTimelineVariables(progress))) {
        root.style.setProperty(property, value);
      }
      const nextScene = getActiveScene(progress);
      root.dataset.progress = progress.toFixed(4);
      root.dataset.phase = nextScene;
      if (nextScene !== activeSceneRef.current) {
        activeSceneRef.current = nextScene;
        setActiveScene(nextScene);
      }
    };

    const schedule = () => {
      if (document.visibilityState === "hidden" || isReduced) return;
      if (!frame) frame = window.requestAnimationFrame(write);
    };

    const onResize = () => {
      measure();
      schedule();
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      isReduced = event.matches;
      root.dataset.reducedMotion = String(isReduced);
      setReducedMotionState(isReduced);
      measure();
      if (isReduced) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        write();
      } else {
        schedule();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      measure();
      schedule();
    };

    isReduced = motionQuery.matches;
    root.dataset.reducedMotion = String(isReduced);
    setReducedMotionState(isReduced);
    measure();
    if (isReduced) write();
    else schedule();

    const resizeTarget = window.visualViewport ?? window;
    window.addEventListener("scroll", schedule, { passive: true });
    resizeTarget.addEventListener("resize", onResize, { passive: true });
    motionQuery.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", schedule);
      resizeTarget.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (frame) window.cancelAnimationFrame(frame);
      for (const property of Object.keys(getTimelineVariables(0))) root.style.removeProperty(property);
    };
  }, [rootRef]);

  return { activeScene, reducedMotion };
}
