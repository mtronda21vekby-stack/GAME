import React from "react";
import { CINEMATIC_TIMELINE } from "../timeline";
import type { SceneId } from "../types";

type ExperienceChromeProps = {
  activeScene: SceneId;
  statusSource: string;
};

export function ExperienceChrome({ activeScene }: ExperienceChromeProps) {
  return (
    <header className="bcCinematic__chrome">
      <div className="bcCinematic__brand">
        <strong>BLACKCROWN</strong>
        <span>INTERACTIVE NETWORK</span>
      </div>
      <div className="bcCinematic__progress" aria-hidden="true">
        {CINEMATIC_TIMELINE.map((scene) => (
          <i key={scene.id} data-active={scene.id === activeScene ? "true" : "false"} />
        ))}
      </div>
      <nav className="bcCinematic__nav" aria-label="Разделы BlackCrown">
        <a href="/about">О проекте</a>
        <a href="/store">Store</a>
        <a href="/account">Профиль</a>
      </nav>
    </header>
  );
}
