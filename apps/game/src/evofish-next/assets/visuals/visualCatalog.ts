import type { NextWorldConfig } from "../../core/engineTypes";
import type { NextResourceKind } from "../../content/resources";

export type EvoFishWaterThemeId = "reef_blue" | "kelp_green" | "deep_violet" | "abyss_gold" | "dark_cave";
export type EvoFishVisualRarity = "common" | "rare" | "epic" | "legendary";

export type EvoFishWaterTheme = {
  id: EvoFishWaterThemeId;
  minLevel: number;
  name: string;
  top: string;
  bottom: string;
  grid: string;
  border: string;
  particle: string;
};

export type EvoFishVisualAsset = {
  id: string;
  name: string;
  path: string;
  rarity?: EvoFishVisualRarity;
};

export type EvoFishResourceVisual = {
  id: NextResourceKind;
  name: string;
  iconPath: string;
  color: string;
  glow: string;
};

export const EVOFISH_VISUAL_ASSET_ROOT = "/game/assets/evofish";
export const DARK_CAVE_ARTIFACTS_REQUIRED = 3;

export const EVOFISH_VISUALS = {
  folders: {
    fish: `${EVOFISH_VISUAL_ASSET_ROOT}/skins/fish`,
    shark: `${EVOFISH_VISUAL_ASSET_ROOT}/skins/shark`,
    megalodon: `${EVOFISH_VISUAL_ASSET_ROOT}/skins/megalodon`,
    npc: `${EVOFISH_VISUAL_ASSET_ROOT}/skins/npc`,
    resources: `${EVOFISH_VISUAL_ASSET_ROOT}/resources`,
    ui: `${EVOFISH_VISUAL_ASSET_ROOT}/ui`,
    water: `${EVOFISH_VISUAL_ASSET_ROOT}/water`,
    portals: `${EVOFISH_VISUAL_ASSET_ROOT}/portals`,
    maps: `${EVOFISH_VISUAL_ASSET_ROOT}/maps`
  },
  waterThemes: [
    { id: "reef_blue", minLevel: 1, name: "Reef Blue", top: "#07324d", bottom: "#020b15", grid: "rgba(150,230,255,.055)", border: "rgba(150,230,255,.16)", particle: "rgba(120,240,255,.16)" },
    { id: "kelp_green", minLevel: 8, name: "Kelp Green", top: "#073d38", bottom: "#020e16", grid: "rgba(110,255,180,.052)", border: "rgba(110,255,180,.15)", particle: "rgba(110,255,180,.14)" },
    { id: "deep_violet", minLevel: 16, name: "Deep Violet", top: "#171f4e", bottom: "#030914", grid: "rgba(180,140,255,.055)", border: "rgba(180,140,255,.18)", particle: "rgba(180,140,255,.14)" },
    { id: "abyss_gold", minLevel: 28, name: "Abyss Gold", top: "#2b2740", bottom: "#060810", grid: "rgba(255,220,120,.052)", border: "rgba(255,220,120,.18)", particle: "rgba(255,220,120,.14)" },
    { id: "dark_cave", minLevel: 999, name: "Dark Cave", top: "#070812", bottom: "#01040a", grid: "rgba(120,80,255,.055)", border: "rgba(190,140,255,.20)", particle: "rgba(190,140,255,.15)" }
  ] satisfies EvoFishWaterTheme[],
  resources: {
    pearls: { id: "pearls", name: "Жемчуг", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/pearls.png`, color: "#fff3a0", glow: "rgba(255,220,120,.34)" },
    coral: { id: "coral", name: "Кристалл", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/crystal.png`, color: "#8fe8ff", glow: "rgba(190,140,255,.34)" },
    plankton: { id: "plankton", name: "Опыт", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/xp-plankton.png`, color: "#78f0ff", glow: "rgba(120,240,255,.28)" },
    heal: { id: "heal", name: "Лечение", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/heal-bubble.png`, color: "#6effb4", glow: "rgba(110,255,180,.28)" },
    boost: { id: "boost", name: "Искра", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/current-spark.png`, color: "#b48cff", glow: "rgba(180,140,255,.28)" },
    speed_perk: { id: "speed_perk", name: "SPD", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/perk-speed.png`, color: "#5bf0ff", glow: "rgba(91,240,255,.30)" },
    damage_perk: { id: "damage_perk", name: "DMG", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/perk-damage.png`, color: "#ffd36d", glow: "rgba(255,180,90,.30)" },
    shield_perk: { id: "shield_perk", name: "SHD", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/perk-shield.png`, color: "#9affc1", glow: "rgba(110,255,180,.30)" },
    artifact_shell: { id: "artifact_shell", name: "Артефакт", iconPath: `${EVOFISH_VISUAL_ASSET_ROOT}/resources/artifact-shell.png`, color: "#ffcc6d", glow: "rgba(255,204,109,.34)" }
  } satisfies Record<NextResourceKind, EvoFishResourceVisual>,
  portals: {
    darkCave: {
      id: "dark_cave_portal",
      name: "Портал тёмной пещеры",
      path: `${EVOFISH_VISUAL_ASSET_ROOT}/portals/dark-cave-portal.png`,
      rarity: "legendary" as EvoFishVisualRarity
    },
    oceanReturn: {
      id: "ocean_return_portal",
      name: "Портал основного океана",
      path: `${EVOFISH_VISUAL_ASSET_ROOT}/portals/ocean-return-portal.png`,
      rarity: "epic" as EvoFishVisualRarity
    }
  },
  ui: {
    primaryButton: { id: "primary_button", name: "Главная кнопка", path: `${EVOFISH_VISUAL_ASSET_ROOT}/ui/button-primary.png` },
    panelFrame: { id: "panel_frame", name: "Панель", path: `${EVOFISH_VISUAL_ASSET_ROOT}/ui/panel-frame.png` },
    xpBar: { id: "xp_bar", name: "Опыт", path: `${EVOFISH_VISUAL_ASSET_ROOT}/ui/xp-bar.png` }
  }
} as const;

export function getResourceVisual(kind: NextResourceKind): EvoFishResourceVisual {
  return EVOFISH_VISUALS.resources[kind];
}

export function getWaterThemeForLevel(level: number, darkCaveActive = false): EvoFishWaterTheme {
  if (darkCaveActive) return EVOFISH_VISUALS.waterThemes.find((theme) => theme.id === "dark_cave") || EVOFISH_VISUALS.waterThemes[0];
  const safeLevel = Math.max(1, Math.floor(level || 1));
  return [...EVOFISH_VISUALS.waterThemes]
    .filter((theme) => theme.id !== "dark_cave" && safeLevel >= theme.minLevel)
    .sort((a, b) => b.minLevel - a.minLevel)[0] || EVOFISH_VISUALS.waterThemes[0];
}

export function darkCavePortalUnlocked(artifactsFound = 0) {
  return Math.max(0, Math.floor(artifactsFound || 0)) >= DARK_CAVE_ARTIFACTS_REQUIRED;
}

export function darkCavePortalPosition(config: NextWorldConfig) {
  return {
    x: Math.round(config.width * 0.86),
    y: Math.round(config.height * 0.76),
    radius: 94
  };
}

export function oceanReturnPortalPosition(config: NextWorldConfig) {
  return {
    x: Math.round(config.width * 0.14),
    y: Math.round(config.height * 0.24),
    radius: 88
  };
}
