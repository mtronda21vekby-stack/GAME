import type { NextEngineState, NextQuestState } from "../core/engineTypes";
import type { EvoFishCurrency } from "../core/types";
import { normalizeNextAccount, type NextAccountState } from "../content/account";
import { defaultAchievementState, type NextAchievementState } from "../content/achievements";
import { defaultMutationState, NEXT_MUTATIONS, type NextMutationState } from "../content/mutations";
import { xpToNextLevel, xpToNextTier } from "../content/progression";
import { canUnlockSkinInNext, canUseSkinInNext } from "../content/skinUnlockRules";
import { EVOFISH_SKIN_BY_ID, getDefaultSkinId } from "../content/skins";
import {
  defaultNextProgress,
  defaultNextQuests,
  migrateLegacySkinSave,
  type EvoFishNextProgressState,
  type EvoFishNextSkinSave,
  type LegacyEvoFishSave
} from "./skinSaveAdapter";

export const EVOFISH_NEXT_SAVE_KEY = "evofish_next_save_v1";
export const LEGACY_EVOFISH_SAVE_KEY = "evofish_save_v0_00_1_alpha";

function safeReadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWriteJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // local save is optional in blocked/private modes
  }
}

function normalizeProgress(progress: Partial<EvoFishNextProgressState> | null | undefined): EvoFishNextProgressState {
  const fallback = defaultNextProgress();
  const level = Math.max(1, Math.floor(progress?.level || fallback.level));
  const tier = Math.max(1, Math.min(12, Math.floor(progress?.tier || fallback.tier)));
  const hpMax = Math.max(1, Math.floor(progress?.hpMax || fallback.hpMax));

  return {
    level,
    tier,
    xp: Math.max(0, Math.floor(progress?.xp || 0)),
    xpToNext: xpToNextTier(tier),
    levelXp: Math.max(0, Math.floor(progress?.levelXp || 0)),
    levelXpToNext: xpToNextLevel(level),
    mass: Math.max(1, Number(progress?.mass || fallback.mass)),
    hp: Math.max(1, Math.min(hpMax, Math.floor(progress?.hp || hpMax))),
    hpMax,
    form: progress?.form || fallback.form,
    kills: Math.max(0, Math.floor(progress?.kills || 0)),
    deaths: Math.max(0, Math.floor(progress?.deaths || 0))
  };
}

function normalizeQuests(quests: Partial<NextQuestState> | null | undefined): NextQuestState {
  const fallback = defaultNextQuests();
  return {
    completed: {
      ...fallback.completed,
      ...(quests?.completed || {})
    },
    baselines: {
      ...fallback.baselines,
      ...(quests?.baselines || {})
    },
    counters: {
      ...fallback.counters,
      ...(quests?.counters || {})
    },
    dailyKey: quests?.dailyKey || fallback.dailyKey,
    weeklyKey: quests?.weeklyKey || fallback.weeklyKey,
    directorFocus: quests?.directorFocus || fallback.directorFocus
  };
}

function normalizeAchievements(achievements: Partial<NextAchievementState> | null | undefined): NextAchievementState {
  const fallback = defaultAchievementState();
  return {
    unlocked: {
      ...fallback.unlocked,
      ...(achievements?.unlocked || {})
    }
  };
}

function normalizeMutations(mutations: Partial<NextMutationState> | null | undefined): NextMutationState {
  const levels: Record<string, number> = {};
  const input = mutations?.levels || {};

  for (const mutation of NEXT_MUTATIONS) {
    levels[mutation.id] = Math.max(0, Math.min(mutation.maxLevel, Math.floor(input[mutation.id] || 0)));
  }

  return { ...defaultMutationState(), levels };
}

function normalizeAccount(account: Partial<NextAccountState> | null | undefined): NextAccountState {
  return normalizeNextAccount(account);
}

function bumpCounter(quests: NextQuestState, key: string, amount = 1) {
  quests.counters = quests.counters || {};
  quests.counters[key] = Math.max(0, Math.floor((quests.counters[key] || 0) + amount));
}

function normalizeSave(save: EvoFishNextSkinSave): EvoFishNextSkinSave {
  const equipped = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId]
    ? save.loadout.equippedSkinId
    : getDefaultSkinId();

  return {
    schemaVersion: 1,
    account: normalizeAccount(save.account),
    economy: {
      pearls: Math.max(0, Math.floor(save.economy?.pearls || 0)),
      corals: Math.max(0, Math.floor(save.economy?.corals || 0))
    },
    loadout: {
      equippedSkinId: equipped,
      ownedSkins: {
        default: true,
        ...(save.loadout.ownedSkins || {})
      }
    },
    progress: normalizeProgress(save.progress),
    quests: normalizeQuests(save.quests),
    mutations: normalizeMutations(save.mutations),
    achievements: normalizeAchievements(save.achievements)
  };
}

export function loadEvoFishNextSave(): EvoFishNextSkinSave {
  const next = safeReadJSON<EvoFishNextSkinSave>(EVOFISH_NEXT_SAVE_KEY);
  if (next?.schemaVersion === 1) return normalizeSave(next);

  const legacy = safeReadJSON<LegacyEvoFishSave>(LEGACY_EVOFISH_SAVE_KEY);
  const migrated = normalizeSave(migrateLegacySkinSave(legacy));
  safeWriteJSON(EVOFISH_NEXT_SAVE_KEY, migrated);
  return migrated;
}

export function saveEvoFishNextSave(save: EvoFishNextSkinSave) {
  safeWriteJSON(EVOFISH_NEXT_SAVE_KEY, normalizeSave(save));
}

export function saveEvoFishNextProgress(engine: NextEngineState) {
  const save = loadEvoFishNextSave();
  save.account = normalizeAccount(engine.account || save.account);
  save.economy = {
    pearls: Math.max(0, Math.floor(engine.economy.pearls || 0)),
    corals: Math.max(0, Math.floor(engine.economy.corals || 0))
  };

  if (engine.player.dead || engine.player.downed) {
    save.progress = defaultNextProgress();
  } else {
    save.progress = normalizeProgress({
      level: engine.player.level,
      tier: engine.player.tier,
      xp: engine.player.xp,
      xpToNext: engine.player.xpToNext,
      levelXp: engine.player.levelXp,
      levelXpToNext: engine.player.levelXpToNext,
      mass: engine.player.mass,
      hp: engine.player.hp,
      hpMax: engine.player.hpMax,
      form: engine.player.form,
      kills: engine.stats.kills,
      deaths: engine.stats.deaths
    });
  }

  save.quests = normalizeQuests(engine.quests);
  save.mutations = normalizeMutations(engine.mutations || save.mutations);
  save.achievements = normalizeAchievements(engine.achievements || save.achievements);
  saveEvoFishNextSave(save);
}

export function isSkinOwned(save: EvoFishNextSkinSave, skinId: string) {
  return Boolean(save.loadout.ownedSkins[skinId]);
}

export function getCurrencyBalance(save: EvoFishNextSkinSave, currency: EvoFishCurrency) {
  return currency === "pearls" ? save.economy.pearls : save.economy.corals;
}

export function canBuySkin(save: EvoFishNextSkinSave, skinId: string) {
  const skin = EVOFISH_SKIN_BY_ID[skinId];
  if (!skin) return false;
  if (isSkinOwned(save, skinId)) return false;
  return canUnlockSkinInNext(normalizeSave(save), skin);
}

export function buySkin(save: EvoFishNextSkinSave, skinId: string): EvoFishNextSkinSave {
  const skin = EVOFISH_SKIN_BY_ID[skinId];
  if (!skin || isSkinOwned(save, skinId) || !canBuySkin(save, skinId)) return save;

  const next = normalizeSave(save);

  if (skin.unlock.type === "currency") {
    if (skin.unlock.currency === "pearls") next.economy.pearls -= skin.unlock.amount;
    else next.economy.corals -= skin.unlock.amount;
  }

  if (skin.unlock.type === "free" || skin.unlock.type === "currency") {
    next.loadout.ownedSkins[skinId] = true;
    next.loadout.equippedSkinId = skinId;
    return normalizeSave(next);
  }

  return save;
}

export function equipSkin(save: EvoFishNextSkinSave, skinId: string): EvoFishNextSkinSave {
  const skin = EVOFISH_SKIN_BY_ID[skinId];
  if (!skin || !isSkinOwned(save, skinId) || !canUseSkinInNext(normalizeSave(save), skin)) return save;

  return normalizeSave({
    ...save,
    loadout: {
      ...save.loadout,
      equippedSkinId: skinId
    }
  });
}

export function canBuyMutation(save: EvoFishNextSkinSave, mutationId: string) {
  const next = normalizeSave(save);
  const mutation = NEXT_MUTATIONS.find((item) => item.id === mutationId);
  if (!mutation) return false;
  const current = next.mutations.levels[mutationId] || 0;
  if (current >= mutation.maxLevel) return false;
  return next.economy.corals >= mutation.coralCost;
}

export function buyMutation(save: EvoFishNextSkinSave, mutationId: string): EvoFishNextSkinSave {
  if (!canBuyMutation(save, mutationId)) return save;
  const next = normalizeSave(save);
  const mutation = NEXT_MUTATIONS.find((item) => item.id === mutationId);
  if (!mutation) return save;

  next.economy.corals -= mutation.coralCost;
  next.mutations.levels[mutationId] = Math.min(mutation.maxLevel, (next.mutations.levels[mutationId] || 0) + 1);
  bumpCounter(next.quests, "mutations");
  return normalizeSave(next);
}
