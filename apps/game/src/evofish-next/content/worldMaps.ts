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
  width: 5200,
  height: 3400,
  enemyTarget: 60,
  resourceTarget: 66
};

export const EVOFISH_WORLD_MAPS: Record<EvoFishWorldId, EvoFishWorldMapDefinition> = {
  main_reef: {
    id: "main_reef",
    name: "Большой океан",
    shortName: "Океан+",
    description: "Расширенная карта: рифы, течения, жемчужные банки, глубокие зоны и охотничьи воды.",
    config: EVOFISH_WORLD_CONFIG,
    neon: false
  },
  dark_cave: {
    id: "dark_cave",
    name: "Тёмная неоновая пещера",
    shortName: "Пещера+",
    description: "Расширенный тёмный мир: неоновые леса, кристальные каньоны, эхо-ядро и древние руины.",
    config: EVOFISH_WORLD_CONFIG,
    neon: true
  }
};

export function getWorldMap(id: EvoFishWorldId = "main_reef") {
  return EVOFISH_WORLD_MAPS[id] || EVOFISH_WORLD_MAPS.main_reef;
}
