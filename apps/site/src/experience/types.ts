import type React from "react";
import type { SitePath } from "../routes/routeMetadata";

export type SceneId = "crown" | "gate" | "evofish" | "crown-front" | "network";
export type KeyArtId = "hero" | "evofish" | "crown-front" | "network";
export type WorldStatus = { status: string };

export type KeyArtHandler = (event: React.SyntheticEvent<HTMLImageElement>, id: KeyArtId) => void;

export type CinematicExperienceProps = {
  evofish: WorldStatus;
  crownFront: WorldStatus;
  network: WorldStatus;
  statusSource: string;
  onNavigate: (path: SitePath) => void;
  onPlay: () => void;
  onOpenCrownFront: () => void;
  onOpenLobby: () => void;
};

export type SceneRuntimeProps = {
  active: boolean;
  reducedMotion: boolean;
};
