import type { EvoFishRarity, EvoFishSkinDefinition } from "../core/types";
import type { EvoFishNextSkinSave } from "../state/skinSaveAdapter";

export type NextSkinLockReason = {
  code: "level" | "tier" | "currency" | "achievement";
  label: string;
};

type SkinProgressRequirement = {
  minLevel?: number;
  minTier?: number;
};

const RARITY_TIER_REQUIREMENT: Record<EvoFishRarity, number> = {
  common: 1,
  premium: 1,
  rare: 2,
  epic: 4,
  legendary: 7
};

const SKIN_REQUIREMENT_OVERRIDES: Record<string, SkinProgressRequirement> = {
  gold_scale: { minTier: 3 },
  cyber_fish: { minTier: 4 },
  pirate_fish: { minTier: 5 },
  shark_white: { minLevel: 30, minTier: 5 },
  mega_bone: { minLevel: 60, minTier: 5 },
  mega_lava: { minLevel: 60, minTier: 6 },
  mega_ice: { minLevel: 60, minTier: 6 },
  mega_nebula: { minLevel: 60, minTier: 8 }
};

function baseRequirementForSkin(skin: EvoFishSkinDefinition): SkinProgressRequirement {
  const rarityTier = RARITY_TIER_REQUIREMENT[skin.rarity] || 1;
  const formLevel = skin.form === "shark" ? 30 : skin.form === "megalodon" ? 60 : 1;
  const override = SKIN_REQUIREMENT_OVERRIDES[skin.id] || {};

  return {
    minLevel: Math.max(formLevel, override.minLevel || 1),
    minTier: Math.max(rarityTier, override.minTier || 1)
  };
}

export function getSkinProgressRequirement(skin: EvoFishSkinDefinition): SkinProgressRequirement {
  return baseRequirementForSkin(skin);
}

export function getSkinProgressLockReasons(save: EvoFishNextSkinSave, skin: EvoFishSkinDefinition): NextSkinLockReason[] {
  const req = getSkinProgressRequirement(skin);
  const progress = save.progress;
  const reasons: NextSkinLockReason[] = [];

  if (req.minLevel && progress.level < req.minLevel) {
    reasons.push({ code: "level", label: `Нужен LV ${req.minLevel}` });
  }

  if (req.minTier && progress.tier < req.minTier) {
    reasons.push({ code: "tier", label: `Нужен Tier ${req.minTier}` });
  }

  if (skin.unlock.type === "achievement") {
    reasons.push({ code: "achievement", label: "Нужен achievement" });
  }

  return reasons;
}

export function getSkinUnlockReasons(save: EvoFishNextSkinSave, skin: EvoFishSkinDefinition): NextSkinLockReason[] {
  const reasons = getSkinProgressLockReasons(save, skin);

  if (save.loadout.ownedSkins[skin.id]) return reasons;

  if (skin.unlock.type === "currency") {
    const balance = skin.unlock.currency === "pearls" ? save.economy.pearls : save.economy.corals;
    if (balance < skin.unlock.amount) {
      reasons.push({
        code: "currency",
        label: `Нужно ${skin.unlock.amount} ${skin.unlock.currency === "pearls" ? "жемчуг" : "кораллы"}`
      });
    }
  }

  return reasons;
}

export function canUseSkinInNext(save: EvoFishNextSkinSave, skin: EvoFishSkinDefinition) {
  return getSkinProgressLockReasons(save, skin).length === 0;
}

export function canUnlockSkinInNext(save: EvoFishNextSkinSave, skin: EvoFishSkinDefinition) {
  return getSkinUnlockReasons(save, skin).length === 0;
}

export function firstSkinLockLabel(save: EvoFishNextSkinSave, skin: EvoFishSkinDefinition) {
  return getSkinUnlockReasons(save, skin)[0]?.label || "Доступно";
}
