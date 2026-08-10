import React from "react";
import { SceneCopy } from "../components/SceneCopy";
import { SceneLayer } from "../components/SceneLayer";
import type { KeyArtHandler, SceneRuntimeProps } from "../types";

type CrownFrontSceneProps = SceneRuntimeProps & {
  status: string;
  onImageHealth: KeyArtHandler;
  onOpen: () => void;
  onLobby: () => void;
};

export function CrownFrontScene({ active, reducedMotion, status, onImageHealth, onOpen, onLobby }: CrownFrontSceneProps) {
  return (
    <SceneLayer id="crown-front" active={active} reducedMotion={reducedMotion} tone="reactor">
      <div className="bcCinematic__visual bcCinematic__visual--crownFront" aria-hidden="true">
        <div className="bcCinematic__mechanicalFrame bcCinematic__mechanicalFrame--left" />
        <img
          className="bcCinematic__frontArt"
          src="/assets/games/crown-front/crown-front-preview.svg"
          alt="CROWN//FRONT alpha key art"
          width="1600"
          height="900"
          loading="lazy"
          decoding="async"
          data-approved-art="placeholder"
          onLoad={(event) => onImageHealth(event, "crown-front")}
          onError={(event) => onImageHealth(event, "crown-front")}
        />
        <div className="bcCinematic__frontGrade" />
        <div className="bcCinematic__reactorCore" />
        <div className="bcCinematic__mechanicalFrame bcCinematic__mechanicalFrame--right" />
      </div>
      <SceneCopy
        scene="crown-front"
        eyebrow={`CROWN//FRONT / ${status} / ALPHA ART`}
        title="ВОЙНА ВНУТРИ МЕХАНИЧЕСКОГО КОРОЛЯ"
        body="Захватывай узлы, контролируй реактор и меняй ход боя в вертикальном PvE-прототипе."
      >
        <button type="button" className="bcCinematic__primary bcCinematic__primary--orange" onClick={onOpen}>Войти в Alpha</button>
        <button type="button" onClick={onLobby}>Lobby</button>
      </SceneCopy>
    </SceneLayer>
  );
}
