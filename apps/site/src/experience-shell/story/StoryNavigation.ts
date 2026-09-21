import React from "react";
import { useExperience } from "../../experience/ExperienceContext";
import { SpatialRouter } from "../core/SpatialRouter";

export function StoryNavigation() {
  const { storyRef, webglAvailable } = useExperience();

  React.useEffect(() => {
    const story = storyRef.current;
    if (!story) return;
    const router = new SpatialRouter({ story });
    return () => router.dispose();
  // Re-resolve a deep link after switching between timeline and natural-flow layouts.
  }, [storyRef, webglAvailable]);

  return null;
}

