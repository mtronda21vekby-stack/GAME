import type { EvoFishCurrency } from "../core/types";
import { EVOFISH_SKIN_BY_ID, getDefaultSkinId } from "../content/skins";
import {
  migrateLegacySkinSave,
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

function normalizeSave(save: EvoFishNextSkinSave): EvoFishNextSkinSave {
  const equipped = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId]
    ? save.loadout.equippedSkinId
    : getDefaultSkinId();

  return {
    schemaVersion: 1,
    economy: {
      pearls: Math.max(0, Math.floor(save.economy.pearls || 0)),
      corals: Math.max(0, Math.floor(save.economy.corals || 0))
    },
    loadout: {
      equippedSkinId: equipped,
      ownedSkins: {
        default: true,
        ...(save.loadout.ownedSkins || {})
      }
    }
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
  if (skin.unlock.type === "free") return true;
  if (skin.unlock.type !== "currency") return false;
  return getCurrencyBalance(save, skin.unlock.currency) >= skin.unlock.amount;
}

export function buySkin(save: EvoFishNextSkinSave, skinId: string): EvoFishNextSkinSave {
  const skin = EVOFISH_SKIN_BY_ID[skinId];
  if (!skin || isSkinOwned(save, skinId)) return save;

  if (skin.unlock.type === "currency") {
    if (!canBuySkin(save, skinId)) return save;
    const next = normalizeSave(save);
    if (skin.unlock.currency === "pearls") next.economy.pearls -= skin.unlock.amount;
    else next.economy.corals -= skin.unlock.amount;
    next.loadout.ownedSkins[skinId] = true;
    next.loadout.equippedSkinId = skinId;
    return normalizeSave(next);
  }

  if (skin.unlock.type === "free") {
    const next = normalizeSave(save);
    next.loadout.ownedSkins[skinId] = true;
    next.loadout.equippedSkinId = skinId;
    return normalizeSave(next);
  }

  return save;
}

export function equipSkin(save: EvoFishNextSkinSave, skinId: string): EvoFishNextSkinSave {
  if (!EVOFISH_SKIN_BY_ID[skinId] || !isSkinOwned(save, skinId)) return save;
  return normalizeSave({
    ...save,
    loadout: {
      ...save.loadout,
      equippedSkinId: skinId
    }
  });
}
