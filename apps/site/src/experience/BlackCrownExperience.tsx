import React from "react";
import { useExperience } from "./ExperienceContext";

export function BlackCrownExperience() {
  const {
    canvasHostRef,
    storyRef,
    requestedQuality,
    setBootStage,
    setMetrics,
    setRuntime,
    setSnapshot,
    setWebglAvailable,
  } = useExperience();
  const initialQualityRef = React.useRef(requestedQuality);

  React.useEffect(() => {
    const container = canvasHostRef.current;
    const story = storyRef.current;
    if (!container || !story) return;
    let disposed = false;
    let runtime: import("./core/ExperienceRuntime").ExperienceRuntime | null = null;
    const onContextLost = () => {
      setWebglAvailable(false);
      setBootStage("fallback");
    };
    const onContextRestored = () => {
      if (!runtime || disposed) return;
      setWebglAvailable(true);
      setBootStage("ready");
    };
    // Context events do not bubble; capture also covers a canvas created later.
    container.addEventListener("webglcontextlost", onContextLost, true);
    container.addEventListener("webglcontextrestored", onContextRestored, true);
    setWebglAvailable(true);
    setBootStage("renderer");
    void import("./core/ExperienceRuntime")
      .then(({ ExperienceRuntime }) => {
        if (disposed) return;
        runtime = new ExperienceRuntime({
          container,
          story,
          initialQuality: initialQualityRef.current,
          onBootStage: setBootStage,
          onSnapshot: setSnapshot,
          onMetrics: setMetrics,
        });
        setRuntime(runtime);
        runtime.start();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        console.warn("BlackCrown Nexus WebGL fallback:", error instanceof Error ? error.message : "renderer unavailable");
        container.dataset.bcExperienceFallback = "true";
        setWebglAvailable(false);
        setBootStage("fallback");
      });

    return () => {
      disposed = true;
      container.removeEventListener("webglcontextlost", onContextLost, true);
      container.removeEventListener("webglcontextrestored", onContextRestored, true);
      runtime?.dispose();
      setRuntime(null);
      delete container.dataset.bcExperienceFallback;
    };
  }, [canvasHostRef, setBootStage, setMetrics, setRuntime, setSnapshot, setWebglAvailable, storyRef]);

  return <div ref={canvasHostRef} className="bcExperienceCanvasHost" aria-hidden="true" />;
}
