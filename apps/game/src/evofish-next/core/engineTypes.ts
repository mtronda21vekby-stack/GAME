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
  bite: boolean;
  dash: boolean;
};

export type NextDamageFloat = {
  id: number;
  x: number;
  y: number;
  text: string;
  ttl: number;
  kind: "damage" | "kill" | "danger";
};

export type NextFishEntity = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  hp: number;
  hpMax: number;
  damage: number;
  form: EvoFishFormId;
  skin: EvoFishSkinDefinition;
  angle: number;
  hitT: number;
};

export type NextPlayerState = NextFishEntity & {
  speed: number;
  biteCd: number;
  dashCd: number;
  dashT: number;
  invulnT: number;
};

export type NextWorldConfig = {
  width: number;
  height: number;
  enemyTarget: number;
};

export type NextEngineStats = {
  mass: number;
  kills: number;
  hp: number;
  hpMax: number;
  skinName: string;
  formName: string;
  lastEvent: string;
};

export type NextEngineState = {
  config: NextWorldConfig;
  player: NextPlayerState;
  enemies: NextFishEntity[];
  floats: NextDamageFloat[];
  frame: number;
  nextFloatId: number;
  stats: NextEngineStats;
};
