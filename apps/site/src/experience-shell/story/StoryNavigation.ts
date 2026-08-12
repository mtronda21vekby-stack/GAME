import React from "react";
import { useExperience } from "../../experience/ExperienceContext";
import { SpatialRouter } from "../core/SpatialRouter";

export function StoryNavigation() {
  const { storyRef } = useExperience();

  React.useEffect(() => {
    const story = storyRef.current;
    if (!story) return;
    const router = new SpatialRouter({ story });
    return () => router.dispose();
  }, [storyRef]);

  return null;
}

