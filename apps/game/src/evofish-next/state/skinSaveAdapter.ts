import type { NextQuestState } from "../core/engineTypes";
import type { EvoFishEconomyState, EvoFishFormId, SkinLoadoutState } from "../core/types";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { EVOFISH_SKIN_BY_ID, getDefaultSkinId } from "../content/skins";

export type LegacyEvoFishSave = {
  pearls?: number;
  corals?: number;
  ownedSkins?: Record<string, boolean>;
  equippedSkin?: string;
  level?: number;
  tier?: number;
  xp?: number;
  levelXp?: number;
  mass?: number;
  hp?: number;
  hpMax?: number;
  form?: EvoFishFormId;
  deaths?: number;
};

export type EvoFishNextProgressState = {
  level: number;
  tier: number;
  xp: number;
  xpToNext: number;
  levelXp: number;
  levelXpToNext: number;
  mass: number;
  hp: number;
  hpMax: number;
  form: EvoFishFormId;
  kills: number;
  deaths: number;
};

export type EvoFishNextSkinSave = {
  schemaVersion: 1;
  economy: EvoFishEconomyState;
  loadout: SkinLoadoutState;
  progress: EvoFishNextProgressState;
  quests: NextQuestState;
};

export function defaultNextProgress(): EvoFishNextProgressState {
  return {
    level: 1,
    tier: 1,
    xp: 0,
    xpToNext: xpToNextTier(1),
    levelXp: 0,
    levelXpToNext: xpToNextLevel(1),
    mass: 1.2,
    hp: 120,
    hpMax: 120,
    form: "fish",
    kills: 0,
    deaths: 0
  };
}

export function defaultNextQuests(): NextQuestState {
  return { completed: {} };
}

export function migrateLegacySkinSave(legacy: LegacyEvoFishSave | null | undefined): EvoFishNextSkinSave {
  const ownedSkins: SkinLoadoutState["ownedSkins"] = { default: true };

  for (const [legacyId, owned] of Object.entries(legacy?.ownedSkins || {})) {
    if (!owned) continue;
    if (EVOFISH_SKIN_BY_ID[legacyId]) ownedSkins[legacyId] = true;
  }

  const equipped = legacy?.equippedSkin && EVOFISH_SKIN_BY_ID[legacy.equippedSkin]
    ? legacy.equippedSkin
    : getDefaultSkinId();

  const level = Math.max(1, Math.floor(legacy?.level || 1));
  const tier = Math.max(1, Math.min(12, Math.floor(legacy?.tier || 1)));
  const hpMax = Math.max(1, Math.floor(legacy?.hpMax || 120));

  return {
    schemaVersion: 1,
    economy: {
      pearls: Math.max(0, Math.floor(legacy?.pearls || 0)),
      corals: Math.max(0, Math.floor(legacy?.corals || 0))
    },
    loadout: {
      equippedSkinId: equipped,
      ownedSkins
    },
    progress: {
      level,
      tier,
      xp: Math.max(0, Math.floor(legacy?.xp || 0)),
      xpToNext: xpToNextTier(tier),
      levelXp: Math.max(0, Math.floor(legacy?.levelXp || 0)),
      levelXpToNext: xpToNextLevel(level),
      mass: Math.max(1, Number(legacy?.mass || 1.2)),
      hp: Math.max(1, Math.min(hpMax, Math.floor(legacy?.hp || hpMax))),
      hpMax,
      form: legacy?.form || "fish",
      kills: 0,
      deaths: Math.max(0, Math.floor(legacy?.deaths || 0))
    },
    quests: defaultNextQuests()
  };
}

export function canEquipSkin(save: EvoFishNextSkinSave, skinId: string) {
  return Boolean(save.loadout.ownedSkins[skinId] && EVOFISH_SKIN_BY_ID[skinId]);
}
