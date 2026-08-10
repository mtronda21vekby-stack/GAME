import React from "react";
import { SceneCopy } from "../components/SceneCopy";
import { SceneLayer } from "../components/SceneLayer";
import type { KeyArtHandler, SceneRuntimeProps } from "../types";

type EvoFishSceneProps = SceneRuntimeProps & {
  status: string;
  onImageHealth: KeyArtHandler;
  onPlay: () => void;
};

export function EvoFishScene({ active, reducedMotion, status, onImageHealth, onPlay }: EvoFishSceneProps) {
  return (
    <SceneLayer id="evofish" active={active} reducedMotion={reducedMotion} tone="ocean">
      <div className="bcCinematic__visual bcCinematic__visual--evofish" aria-hidden="true">
        <div className="bcCinematic__keyArtFallback bcCinematic__keyArtFallback--ocean" />
        <picture>
          <source srcSet="/art/evofish-world.avif" type="image/avif" />
          <source srcSet="/art/evofish-world.webp" type="image/webp" />
          <img
            className="bcCinematic__evoArt"
            src="/art/evofish-world.jpg"
            alt="Подводный мир EvoFish"
            width="800"
            height="500"
            loading="lazy"
            decoding="async"
            onLoad={(event) => onImageHealth(event, "evofish")}
            onError={(event) => onImageHealth(event, "evofish")}
          />
        </picture>
        <div className="bcCinematic__caustics" />
        <div className="bcCinematic__bubbles">
          <i /><i /><i /><i /><i /><i /><i /><i />
        </div>
        <div className="bcCinematic__oceanForeground" />
      </div>
      <SceneCopy
        scene="evofish"
        eyebrow={`EVOFISH / ${status}`}
        title="ЭВОЛЮЦИЯ НАЧИНАЕТСЯ В ГЛУБИНЕ"
        body="Исследуй объёмный океан, развивай хищника и меняй форму вместе с миром."
      >
        <button type="button" className="bcCinematic__primary" onClick={onPlay}>Войти в EvoFish</button>
      </SceneCopy>
    </SceneLayer>
  );
}
