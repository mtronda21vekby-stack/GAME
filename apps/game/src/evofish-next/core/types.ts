export type EvoFishFormId = "fish" | "shark" | "megalodon";

export type EvoFishCurrency = "pearls" | "corals";

export type EvoFishRarity = "common" | "premium" | "rare" | "epic" | "legendary";

export type SkinPatternId =
  | "none"
  | "koi"
  | "royal"
  | "stripes"
  | "glowdot"
  | "scales"
  | "circuit"
  | "pirate"
  | "tiger"
  | "glow"
  | "bone"
  | "cracks"
  | "plates"
  | "stars";

export type SkinUnlockRule =
  | { type: "free" }
  | { type: "currency"; currency: EvoFishCurrency; amount: number }
  | { type: "achievement"; achievementId: string };

export type SkinPalette = {
  primary: string;
  secondary: string;
  accent: string;
  glow?: string;
  shadow?: string;
};

export type EvoFishSkinDefinition = {
  id: string;
  name: string;
  form: EvoFishFormId | "any";
  rarity: EvoFishRarity;
  description: string;
  unlock: SkinUnlockRule;
  palette: SkinPalette;
  pattern: SkinPatternId;
  tags: string[];
  legacyId: string;
  assetPath?: string;
  image?: string;
};

export type OwnedSkinState = Record<string, true>;

export type SkinLoadoutState = {
  equippedSkinId: string;
  ownedSkins: OwnedSkinState;
};

export type EvoFishEconomyState = {
  pearls: number;
  corals: number;
};
