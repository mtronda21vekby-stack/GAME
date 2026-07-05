import type { EvoFishCurrency, EvoFishSkinDefinition } from "../core/types";

export const EVOFISH_SKIN_ASSET_BASE = "/game/skins/custom";
export const EVOFISH_SKIN_ASSET_VERSION = "blue-default-fish-5";

const DEFAULT_BLUE_FISH_ASSET = new URL("../assets/skins/default-blue-fish.png", import.meta.url).href;

const SKIN_ASSET_URLS: Record<string, string> = {
  default: DEFAULT_BLUE_FISH_ASSET,
  premium_fish: DEFAULT_BLUE_FISH_ASSET
};

export function getSkinAssetPath(id: string) {
  const assetUrl = SKIN_ASSET_URLS[id];
  if (assetUrl) return assetUrl;

  return `${EVOFISH_SKIN_ASSET_BASE}/${id}.svg?v=${EVOFISH_SKIN_ASSET_VERSION}`;
}

function withAsset(skin: Omit<EvoFishSkinDefinition, "assetPath" | "image">): EvoFishSkinDefinition {
  const assetPath = getSkinAssetPath(skin.id);
  return {
    ...skin,
    assetPath,
    image: assetPath
  };
}

function freeSkin(
  id: string,
  name: string,
  form: EvoFishSkinDefinition["form"],
  description: string,
  palette: EvoFishSkinDefinition["palette"],
  pattern: EvoFishSkinDefinition["pattern"] = "none"
): EvoFishSkinDefinition {
  return withAsset({
    id,
    legacyId: id,
    name,
    form,
    rarity: "common",
    description,
    unlock: { type: "free" },
    palette,
    pattern,
    tags: ["legacy", "free"]
  });
}

function currencySkin(
  id: string,
  name: string,
  form: EvoFishSkinDefinition["form"],
  currency: EvoFishCurrency,
  amount: number,
  rarity: EvoFishSkinDefinition["rarity"],
  description: string,
  palette: EvoFishSkinDefinition["palette"],
  pattern: EvoFishSkinDefinition["pattern"] = "none",
  tags: string[] = []
): EvoFishSkinDefinition {
  return withAsset({
    id,
    legacyId: id,
    name,
    form,
    rarity,
    description,
    unlock: { type: "currency", currency, amount },
    palette,
    pattern,
    tags: ["legacy", currency, ...tags]
  });
}

function pearlSkin(
  id: string,
  name: string,
  form: EvoFishSkinDefinition["form"],
  amount: number,
  rarity: EvoFishSkinDefinition["rarity"],
  description: string,
  palette: EvoFishSkinDefinition["palette"],
  pattern: EvoFishSkinDefinition["pattern"] = "none",
  tags: string[] = []
) {
  return currencySkin(id, name, form, "pearls", amount, rarity, description, palette, pattern, tags);
}

function coralSkin(
  id: string,
  name: string,
  form: EvoFishSkinDefinition["form"],
  amount: number,
  rarity: EvoFishSkinDefinition["rarity"],
  description: string,
  palette: EvoFishSkinDefinition["palette"],
  pattern: EvoFishSkinDefinition["pattern"] = "none",
  tags: string[] = []
) {
  return currencySkin(id, name, form, "corals", amount, rarity, description, palette, pattern, ["premium-coral", ...tags]);
}

export const EVOFISH_SKINS: EvoFishSkinDefinition[] = [
  freeSkin("default", "Стандарт", "any", "HEIF default fish, fitted for EvoFish gameplay.", {
    primary: "#9fe6ff",
    secondary: "#78c8ff",
    accent: "#ffffff"
  }),

  pearlSkin("premium_fish", "Премиум Рыбка", "fish", 650, "premium", "Красивая 2D-рыбка, не овал.", {
    primary: "#46dcff",
    secondary: "#beffe6",
    accent: "#5078ff",
    glow: "#7cf7ff"
  }),
  pearlSkin("neon_koi", "Неон-Кои", "fish", 1800, "rare", "Неоновый рисунок и лёгкое свечение.", {
    primary: "#ff6ad5",
    secondary: "#6af0ff",
    accent: "#fff3a0",
    glow: "#ff7df0"
  }, "koi", ["neon"]),
  pearlSkin("reef_royal", "Рифовый Роял", "fish", 2600, "rare", "Контрастный премиум-градиент.", {
    primary: "#8cffc1",
    secondary: "#4ad4ff",
    accent: "#b98cff",
    glow: "#7cffd6"
  }, "royal", ["premium"]),
  pearlSkin("clown_pop", "Клоун Поп", "fish", 1100, "premium", "Яркий клоун с полосками.", {
    primary: "#ffb36a",
    secondary: "#fff7d0",
    accent: "#ff5a5a"
  }, "stripes", ["bright"]),
  pearlSkin("angler_glow", "Удильщик", "fish", 4500, "rare", "Лампочка-удочка и глубокий цвет.", {
    primary: "#20405a",
    secondary: "#0a1423",
    accent: "#7cffc8",
    glow: "#7cffc8"
  }, "glowdot", ["deep"]),
  pearlSkin("deep_sapphire", "Сапфир", "fish", 6500, "rare", "Холодный сапфировый градиент.", {
    primary: "#3c78ff",
    secondary: "#14285a",
    accent: "#8cffc1"
  }),
  pearlSkin("gold_scale", "Золотая чешуя", "fish", 11000, "epic", "Металлические блики, богато.", {
    primary: "#ffd778",
    secondary: "#7a5514",
    accent: "#fff1c8",
    glow: "#ffd778"
  }, "scales", ["premium", "gold"]),
  coralSkin("cyber_fish", "Кибер", "fish", 20, "epic", "Техно-полосы и подсветка.", {
    primary: "#78f0ff",
    secondary: "#101e3c",
    accent: "#b98cff",
    glow: "#78f0ff"
  }, "circuit", ["neon", "tech"]),
  pearlSkin("pirate_fish", "Пират", "fish", 18000, "epic", "Шрам, повязка и стиль.", {
    primary: "#ff7878",
    secondary: "#28141e",
    accent: "#ffffff"
  }, "pirate", ["character"]),

  pearlSkin("shark_classic", "Акула Классик", "shark", 4000, "premium", "Классический серый скин для акулы.", {
    primary: "#bfc7d0",
    secondary: "#546070",
    accent: "#ffffff"
  }),
  pearlSkin("shark_tiger", "Тигровая акула", "shark", 8000, "rare", "Полосатая, агрессивная.", {
    primary: "#d4c4a6",
    secondary: "#6b5a44",
    accent: "#ffffff"
  }, "tiger", ["predator"]),
  coralSkin("shark_shadow", "Акула Тень", "shark", 26, "rare", "Тёмная, агрессивная.", {
    primary: "#6d747c",
    secondary: "#14171b",
    accent: "#ff5a5a",
    shadow: "#05070a"
  }, "none", ["dark"]),
  pearlSkin("shark_azure", "Акула Азур", "shark", 12000, "rare", "Синий холодный тон.", {
    primary: "#78c8ff",
    secondary: "#142850",
    accent: "#ffffff"
  }),
  coralSkin("shark_white", "Белая акула", "shark", 40, "epic", "Контрастная белая.", {
    primary: "#eef6ff",
    secondary: "#586274",
    accent: "#0b0f14"
  }, "none", ["contrast"]),

  pearlSkin("mega_deep", "Мегалодон Глубин", "megalodon", 18000, "rare", "Тёмный, тяжёлый силуэт.", {
    primary: "#1f2a3b",
    secondary: "#0a0f18",
    accent: "#7cffc8",
    glow: "#7cffc8"
  }, "glow", ["apex"]),
  coralSkin("mega_bone", "Костяной Мегалодон", "megalodon", 48, "epic", "Костяные пластины и шрамы.", {
    primary: "#d2d2c8",
    secondary: "#464650",
    accent: "#ffffff"
  }, "bone", ["armor"]),
  pearlSkin("mega_lava", "Мега Лава", "megalodon", 32000, "epic", "Трещины лавы и жар.", {
    primary: "#ff6e46",
    secondary: "#280a0a",
    accent: "#ffd778",
    glow: "#ff8c46"
  }, "cracks", ["fire"]),
  coralSkin("mega_ice", "Мега Лёд", "megalodon", 64, "epic", "Ледяные пластины.", {
    primary: "#aaf0ff",
    secondary: "#143c50",
    accent: "#ffffff",
    glow: "#d8fbff"
  }, "plates", ["ice"]),
  pearlSkin("mega_nebula", "Мега Туманность", "megalodon", 65000, "legendary", "Космический перелив.", {
    primary: "#c88cff",
    secondary: "#50a0ff",
    accent: "#ffffff",
    glow: "#b98cff"
  }, "stars", ["cosmic", "legendary"])
];

export const EVOFISH_SKIN_BY_ID = Object.fromEntries(EVOFISH_SKINS.map((skin) => [skin.id, skin] as const));

export function getSkinsForForm(form: EvoFishSkinDefinition["form"]) {
  return EVOFISH_SKINS.filter((skin) => skin.form === "any" || skin.form === form);
}

export function getDefaultSkinId() {
  return "default";
}
