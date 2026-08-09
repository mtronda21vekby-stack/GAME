import React from "react";
import { SceneCopy } from "../components/SceneCopy";
import { SceneLayer } from "../components/SceneLayer";
import type { KeyArtHandler, SceneRuntimeProps } from "../types";

type CrownSceneProps = SceneRuntimeProps & {
  networkStatus: string;
  onImageHealth: KeyArtHandler;
  onPlay: () => void;
  onAbout: () => void;
};

export function CrownScene({ active, reducedMotion, networkStatus, onImageHealth, onPlay, onAbout }: CrownSceneProps) {
  return (
    <SceneLayer id="crown" active={active} reducedMotion={reducedMotion} tone="identity">
      <div className="bcCinematic__visual bcCinematic__visual--crown" aria-hidden="true">
        <div className="bcCinematic__crownField" />
        <div className="bcCinematic__crownHalo" />
        <div className="bcCinematic__keyArtFallback bcCinematic__keyArtFallback--crown" />
        <picture>
          <source srcSet="/art/hero-crown.avif" type="image/avif" />
          <source srcSet="/art/hero-crown.webp" type="image/webp" />
          <img
            className="bcCinematic__crownArt"
            src="/art/hero-crown.jpg"
            alt="Премиальная корона BlackCrown"
            width="600"
            height="750"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={(event) => onImageHealth(event, "hero")}
            onError={(event) => onImageHealth(event, "hero")}
          />
        </picture>
        <div className="bcCinematic__crownCore" />
        <div className="bcCinematic__foreground bcCinematic__foreground--crown" />
      </div>
      <SceneCopy
        scene="crown"
        hero
        eyebrow={`BLACKCROWN NETWORK / ${networkStatus === "LIVE" ? "ONLINE" : networkStatus}`}
        title="BLACKCROWN"
        body="Одна корона. Несколько миров. Единая игровая идентичность."
      >
        <button type="button" className="bcCinematic__primary" onClick={onPlay}>Играть</button>
        <button type="button" onClick={onAbout}>О вселенной</button>
      </SceneCopy>
    </SceneLayer>
  );
}
