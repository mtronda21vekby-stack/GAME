import type { EvoFishCurrency } from "../core/types";

export type NextCraftEffect = "heal" | "barrier" | "bite_boost" | "sonar";

export type NextCraftCost = Partial<Record<EvoFishCurrency, number>>;

export type NextCraftRecipe = {
  id: string;
  name: string;
  description: string;
  cost: NextCraftCost;
  effect: NextCraftEffect;
  value: number;
  duration: number;
};

export type NextCraftState = {
  barrierT: number;
  biteBoostT: number;
  sonarT: number;
};

export const NEXT_CRAFT_RECIPES: NextCraftRecipe[] = [
  {
    id: "heal_gel",
    name: "Лечебный гель",
    description: "Мгновенно восстанавливает 42% HP. Закрывает daily/weekly craft-задачи.",
    cost: { pearls: 95 },
    effect: "heal",
    value: 0.42,
    duration: 0
  },
  {
    id: "reef_barrier",
    name: "Рифовый барьер",
    description: "Даёт временную защиту на 9 секунд и помогает пережить APEX-зону.",
    cost: { pearls: 160, corals: 1 },
    effect: "barrier",
    value: 1,
    duration: 9
  },
  {
    id: "bite_rush",
    name: "Ускоренный укус",
    description: "+38% bite damage на 11 секунд. Хорошо под задания охоты.",
    cost: { pearls: 145, corals: 1 },
    effect: "bite_boost",
    value: 0.38,
    duration: 11
  },
  {
    id: "sonar_ping",
    name: "Сонар",
    description: "Усиливает mini-map, показывает угрозы и ресурсы на 18 секунд.",
    cost: { pearls: 90 },
    effect: "sonar",
    value: 1,
    duration: 18
  }
];

export function defaultCraftState(): NextCraftState {
  return {
    barrierT: 0,
    biteBoostT: 0,
    sonarT: 0
  };
}

export function getCraftCostLabel(cost: NextCraftCost) {
  const parts: string[] = [];
  if (cost.pearls) parts.push(`🦪 ${cost.pearls} жемчуг`);
  if (cost.corals) parts.push(`💎 ${cost.corals} кристалл`);
  return parts.join(" · ") || "Бесплатно";
}
