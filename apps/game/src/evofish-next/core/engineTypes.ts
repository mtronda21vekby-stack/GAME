import type { EvoFishFormId, EvoFishSkinDefinition } from "./types";

export type NextViewport = {
  width: number;
  height: number;
};

export type NextCameraState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NextInputState = {
  pointerX: number;
  pointerY: number;
  down: boolean;
};

export type NextFishEntity = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  form: EvoFishFormId;
  skin: EvoFishSkinDefinition;
  angle: number;
};

export type NextPlayerState = NextFishEntity & {
  speed: number;
};

export type NextWorldConfig = {
  width: number;
  height: number;
  enemyTarget: number;
};

export type NextEngineStats = {
  mass: number;
  kills: number;
  skinName: string;
  formName: string;
};

export type NextEngineState = {
  config: NextWorldConfig;
  player: NextPlayerState;
  enemies: NextFishEntity[];
  frame: number;
  stats: NextEngineStats;
};
