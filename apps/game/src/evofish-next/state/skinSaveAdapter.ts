import type { EvoFishEconomyState, SkinLoadoutState } from "../core/types";
import { EVOFISH_SKIN_BY_ID, getDefaultSkinId } from "../content/skins";

export type LegacyEvoFishSave = {
  pearls?: number;
  corals?: number;
  ownedSkins?: Record<string, boolean>;
  equippedSkin?: string;
};

export type EvoFishNextSkinSave = {
  schemaVersion: 1;
  economy: EvoFishEconomyState;
  loadout: SkinLoadoutState;
};

export function migrateLegacySkinSave(legacy: LegacyEvoFishSave | null | undefined): EvoFishNextSkinSave {
  const ownedSkins: SkinLoadoutState["ownedSkins"] = { default: true };

  for (const [legacyId, owned] of Object.entries(legacy?.ownedSkins || {})) {
    if (!owned) continue;
    if (EVOFISH_SKIN_BY_ID[legacyId]) ownedSkins[legacyId] = true;
  }

  const equipped = legacy?.equippedSkin && EVOFISH_SKIN_BY_ID[legacy.equippedSkin]
    ? legacy.equippedSkin
    : getDefaultSkinId();

  return {
    schemaVersion: 1,
    economy: {
      pearls: Math.max(0, Math.floor(legacy?.pearls || 0)),
      corals: Math.max(0, Math.floor(legacy?.corals || 0))
    },
    loadout: {
      equippedSkinId: equipped,
      ownedSkins
    }
  };
}

export function canEquipSkin(save: EvoFishNextSkinSave, skinId: string) {
  return Boolean(save.loadout.ownedSkins[skinId] && EVOFISH_SKIN_BY_ID[skinId]);
}
