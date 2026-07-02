import type { EvoFishFormId } from "../core/types";

export type EvoFishFormDefinition = {
  id: EvoFishFormId;
  name: string;
  unlockLevel: number;
  skinScale: number;
  silhouette: "fish" | "shark" | "mega";
  combatRole: "starter" | "predator" | "apex";
  description: string;
};

export const EVOFISH_FORMS: Record<EvoFishFormId, EvoFishFormDefinition> = {
  fish: {
    id: "fish",
    name: "Рыба",
    unlockLevel: 1,
    skinScale: 1,
    silhouette: "fish",
    combatRole: "starter",
    description: "Базовая форма. Быстрая, компактная, хорошо подходит для ранней игры."
  },
  shark: {
    id: "shark",
    name: "Акула",
    unlockLevel: 30,
    skinScale: 1.22,
    silhouette: "shark",
    combatRole: "predator",
    description: "Средняя форма. Больше урон и давление, агрессивный темп боя."
  },
  megalodon: {
    id: "megalodon",
    name: "Мегалодон",
    unlockLevel: 60,
    skinScale: 1.48,
    silhouette: "mega",
    combatRole: "apex",
    description: "Поздняя форма. Тяжёлый апекс-хищник с максимальным визуальным весом."
  }
};
