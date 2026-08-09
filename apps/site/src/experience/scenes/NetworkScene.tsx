import React from "react";
import { SceneCopy } from "../components/SceneCopy";
import { SceneLayer } from "../components/SceneLayer";
import type { KeyArtHandler, SceneRuntimeProps } from "../types";

type NetworkSceneProps = SceneRuntimeProps & {
  status: string;
  onImageHealth: KeyArtHandler;
  onAccount: () => void;
  onStore: () => void;
  onLobby: () => void;
};

export function NetworkScene({ active, reducedMotion, status, onImageHealth, onAccount, onStore, onLobby }: NetworkSceneProps) {
  return (
    <SceneLayer id="network" active={active} reducedMotion={reducedMotion} tone="network">
      <div className="bcCinematic__visual bcCinematic__visual--network" aria-hidden="true">
        <div className="bcCinematic__cityGrid" />
        <div className="bcCinematic__city">
          <i /><i /><i /><i /><i /><i /><i /><i /><i />
        </div>
        <img
          className="bcCinematic__networkArt"
          src="/assets/site/neon/network.svg"
          alt="Командное ядро сети BlackCrown"
          width="1200"
          height="800"
          loading="lazy"
          decoding="async"
          onLoad={(event) => onImageHealth(event, "network")}
          onError={(event) => onImageHealth(event, "network")}
        />
        <div className="bcCinematic__networkCore" />
        <div className="bcCinematic__networkForeground" />
      </div>
      <SceneCopy
        scene="network"
        eyebrow={`BLACKCROWN NETWORK / ${status}`}
        title="ОДИН ПРОФИЛЬ. ВСЯ ЭКОСИСТЕМА."
        body="Игры, серверная коллекция, Store и Lobby соединены единым BlackCrown ID."
      >
        <button type="button" className="bcCinematic__primary" onClick={onAccount}>Профиль</button>
        <button type="button" onClick={onStore}>Store</button>
        <button type="button" onClick={onLobby}>Lobby</button>
      </SceneCopy>
    </SceneLayer>
  );
}
