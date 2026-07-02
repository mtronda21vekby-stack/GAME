import type { EvoFishFormId, EvoFishSkinDefinition } from "./types";
import type { NextEnemyArchetypeId } from "../content/enemyArchetypes";

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

export type NextAIState = "wander" | "hunt" | "flee" | "attack";

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
  speed: number;
  form: EvoFishFormId;
  skin: EvoFishSkinDefinition;
  angle: number;
  hitT: number;
  aiType: NextEnemyArchetypeId;
  aiState: NextAIState;
  aggroRadius: number;
  attackRange: number;
  attackCd: number;
  thinkT: number;
  wanderX: number;
  wanderY: number;
  wanderT: number;
};

export type NextPlayerState = NextFishEntity & {
  biteCd: number;
  dashCd: number;
  dashT: number;
  invulnT: number;
  level: number;
  tier: number;
  xp: number;
  xpToNext: number;
  levelXp: number;
  levelXpToNext: number;
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
  level: number;
  tier: number;
  xp: number;
  xpToNext: number;
  levelXp: number;
  levelXpToNext: number;
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
