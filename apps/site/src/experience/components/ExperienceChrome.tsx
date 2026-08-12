import React from "react";
import { CINEMATIC_TIMELINE } from "../timeline";
import type { SceneId } from "../types";

type ExperienceChromeProps = {
  activeScene: SceneId;
  statusSource: string;
};

export function ExperienceChrome({ activeScene, statusSource }: ExperienceChromeProps) {
  return (
    <div className="bcCinematic__chrome" aria-hidden="true">
      <div className="bcCinematic__brand">
        <strong>BLACKCROWN</strong>
        <span>INTERACTIVE NETWORK</span>
      </div>
      <div className="bcCinematic__progress">
        {CINEMATIC_TIMELINE.map((scene) => (
          <i key={scene.id} data-active={scene.id === activeScene ? "true" : "false"} />
        ))}
      </div>
      <span className="bcCinematic__source">SIGNAL / {statusSource.toUpperCase()}</span>
    </div>
  );
}
