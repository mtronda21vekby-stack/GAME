import React from "react";
import { ExperienceChrome } from "./components/ExperienceChrome";
import { CrownFrontScene } from "./scenes/CrownFrontScene";
import { CrownScene } from "./scenes/CrownScene";
import { EvoFishScene } from "./scenes/EvoFishScene";
import { NetworkScene } from "./scenes/NetworkScene";
import { WorldGateScene } from "./scenes/WorldGateScene";
import type { CinematicExperienceProps, KeyArtHandler, KeyArtId } from "./types";
import { useCinematicTimeline } from "./useCinematicTimeline";
import "../styles/cinematic.css";

const EXPECTED_KEY_ART = 4;

export function CinematicExperience({
  evofish,
  crownFront,
  network,
  statusSource,
  onNavigate,
  onPlay,
  onOpenCrownFront,
  onOpenLobby,
}: CinematicExperienceProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const healthyKeyArt = React.useRef(new Set<KeyArtId>());
  const { activeScene, reducedMotion } = useCinematicTimeline(rootRef);

  const handleImageHealth = React.useCallback<KeyArtHandler>((event, id) => {
    const image = event.currentTarget;
    const valid = image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    image.dataset.keyArtStatus = valid ? "ready" : "error";

    if (valid) healthyKeyArt.current.add(id);
    else healthyKeyArt.current.delete(id);

    const root = rootRef.current;
    if (!root) return;
    if (!valid) root.dataset.keyArtStatus = "error";
    else if (healthyKeyArt.current.size === EXPECTED_KEY_ART) root.dataset.keyArtStatus = "ready";
  }, []);

  return (
    <section
      ref={rootRef}
      id="worlds"
      className="bcCinematic"
      data-phase="crown"
      data-progress="0.0000"
      data-key-art-status="loading"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-label="BlackCrown cinematic experience"
    >
      <div className="bcCinematic__stage">
        <CrownScene
          active={activeScene === "crown"}
          reducedMotion={reducedMotion}
          networkStatus={network.status}
          onImageHealth={handleImageHealth}
          onPlay={onPlay}
          onAbout={() => onNavigate("/about")}
        />
        <WorldGateScene active={activeScene === "gate"} reducedMotion={reducedMotion} />
        <EvoFishScene
          active={activeScene === "evofish"}
          reducedMotion={reducedMotion}
          status={evofish.status}
          onImageHealth={handleImageHealth}
          onPlay={onPlay}
        />
        <CrownFrontScene
          active={activeScene === "crown-front"}
          reducedMotion={reducedMotion}
          status={crownFront.status}
          onImageHealth={handleImageHealth}
          onOpen={onOpenCrownFront}
          onLobby={onOpenLobby}
        />
        <NetworkScene
          active={activeScene === "network"}
          reducedMotion={reducedMotion}
          status={network.status}
          onImageHealth={handleImageHealth}
          onAccount={() => onNavigate("/account")}
          onStore={() => onNavigate("/store")}
          onLobby={onOpenLobby}
        />

        <div className="bcCinematic__grain" aria-hidden="true" />
        <div className="bcCinematic__scan" aria-hidden="true" />
        <ExperienceChrome activeScene={activeScene} statusSource={statusSource} />
        <div className="bcCinematic__scrollHint" aria-hidden="true"><span>SCROLL TO ENTER</span><i /></div>
      </div>
    </section>
  );
}

export default CinematicExperience;
