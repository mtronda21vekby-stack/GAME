import type { EvoFishEconomyState, EvoFishFormId, EvoFishSkinDefinition } from "./types";
import type { NextAccountState } from "../content/account";
import type { NextAchievementState } from "../content/achievements";
import type { NextEnemyArchetypeId } from "../content/enemyArchetypes";
import type { NextCraftState } from "../content/craft";
import type { NextMapEventState } from "../content/events";
import type { NextMutationState } from "../content/mutations";
import type { NextResourceNode } from "../content/resources";
import type { EvoFishWorldId } from "../content/worldMaps";
import type { NextZoneId } from "../content/zones";

export type NextRenderQuality = "low" | "balanced" | "high";

export type NextViewport = {
  width: number;
  height: number;
  zoom?: number;
  quality?: NextRenderQuality;
};

export type NextCameraState = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

export type NextInputState = {
  pointerX: number;
  pointerY: number;
  down: boolean;
  bite: boolean;
  dash: boolean;
  moveX?: number;
  moveY?: number;
};

export type NextDamageFloat = {
  id: number;
  x: number;
  y: number;
  text: string;
  ttl: number;
  kind: "damage" | "kill" | "danger";
};

export type NextMutationDraftState = {
  id: number;
  source: "level" | "tier" | "director";
  options: string[];
  createdFrame: number;
};

export type NextQuestState = {
  completed: Record<string, true>;
  baselines?: Record<string, number>;
  counters?: Record<string, number>;
  dailyKey?: string;
  weeklyKey?: string;
  directorFocus?: string;
};

export type NextPortalTransitionState = {
  active: boolean;
  fromWorld: EvoFishWorldId;
  toWorld: EvoFishWorldId;
  direction: "to_dark_cave" | "to_main";
  progress: number;
  message: string;
};

export type NextStoryState = {
  darkCaveUnlocked: boolean;
  darkCaveEntered: boolean;
  currentTitle: string;
  currentObjective: string;
  completed: Record<string, true>;
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
  familyName?: string;
  familyRewardMultiplier?: number;
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
  dead?: boolean;
  deathT?: number;
  respawnT?: number;
  downed?: boolean;
  downT?: number;
  reviveT?: number;
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
  resourceTarget: number;
};

export type NextEngineStats = {
  mass: number;
  kills: number;
  deaths?: number;
  downs?: number;
  accountName?: string;
  accountLevel?: number;
  accountXp?: number;
  accountXpToNext?: number;
  lastRunAccountXp?: number;
  hp: number;
  hpMax: number;
  level: number;
  tier: number;
  xp: number;
  xpToNext: number;
  levelXp: number;
  levelXpToNext: number;
  pearls: number;
  corals: number;
  mutationLevel: number;
  mutationDraftReady?: boolean;
  achievementsUnlocked?: number;
  craftUses?: number;
  mutationPurchases?: number;
  perksPicked?: number;
  artifactsFound?: number;
  questDirectorFocus?: string;
  dailyQuestKey?: string;
  weeklyQuestKey?: string;
  craftBarrierT: number;
  craftBiteBoostT: number;
  craftSonarT: number;
  resourcesCollected?: number;
  activeResources?: number;
  activeEventTitle?: string;
  activeEventProgress?: number;
  activeEventTarget?: number;
  activeEventTime?: number;
  activeEventKind?: string;
  worldName?: string;
  storyTitle?: string;
  storyObjective?: string;
  portalLoading?: number;
  zoneId: NextZoneId;
  zoneName: string;
  zoneEffect: string;
  zoneRisk: number;
  zoneRewardBoost: number;
  completedQuests: number;
  activeQuestTitle: string;
  activeQuestProgress: number;
  activeQuestTarget: number;
  apexAlive: boolean;
  apexName: string;
  apexHp: number;
  apexHpMax: number;
  dead?: boolean;
  respawnTime?: number;
  downed?: boolean;
  reviveTime?: number;
  skinName: string;
  formName: string;
  lastEvent: string;
};

export type NextEngineState = {
  config: NextWorldConfig;
  worldId: EvoFishWorldId;
  portalTransition?: NextPortalTransitionState | null;
  story: NextStoryState;
  account: NextAccountState;
  economy: EvoFishEconomyState;
  achievements: NextAchievementState;
  craft: NextCraftState;
  mutations: NextMutationState;
  mutationDraft?: NextMutationDraftState | null;
  quests: NextQuestState;
  player: NextPlayerState;
  enemies: NextFishEntity[];
  resources: NextResourceNode[];
  events?: NextMapEventState[];
  floats: NextDamageFloat[];
  frame: number;
  nextFloatId: number;
  stats: NextEngineStats;
};
