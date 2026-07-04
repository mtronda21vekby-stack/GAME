import type { NextWorldConfig } from "../core/engineTypes";

export type EvoFishWorldId = "main_reef" | "dark_cave";

export type EvoFishWorldMapDefinition = {
  id: EvoFishWorldId;
  name: string;
  shortName: string;
  description: string;
  config: NextWorldConfig;
  neon: boolean;
};

export const EVOFISH_WORLD_CONFIG: NextWorldConfig = {
  width: 3640,
  height: 2340,
  enemyTarget: 46,
  resourceTarget: 42
};

export const EVOFISH_WORLD_MAPS: Record<EvoFishWorldId, EvoFishWorldMapDefinition> = {
  main_reef: {
    id: "main_reef",
    name: "Основной океан",
    shortName: "Океан",
    description: "Открытая зона роста, ресурсов и первых хищников.",
    config: EVOFISH_WORLD_CONFIG,
    neon: false
  },
  dark_cave: {
    id: "dark_cave",
    name: "Тёмная неоновая пещера",
    shortName: "Пещера",
    description: "Отдельный мир того же размера: тёмная вода, неон, древние артефакты и новая сюжетная ветка.",
    config: EVOFISH_WORLD_CONFIG,
    neon: true
  }
};

export function getWorldMap(id: EvoFishWorldId = "main_reef") {
  return EVOFISH_WORLD_MAPS[id] || EVOFISH_WORLD_MAPS.main_reef;
}
