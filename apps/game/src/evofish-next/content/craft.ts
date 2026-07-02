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
    description: "Мгновенно восстанавливает 38% HP.",
    cost: { pearls: 75 },
    effect: "heal",
    value: 0.38,
    duration: 0
  },
  {
    id: "reef_barrier",
    name: "Рифовый барьер",
    description: "Даёт временную защиту на 8 секунд.",
    cost: { pearls: 110, corals: 1 },
    effect: "barrier",
    value: 1,
    duration: 8
  },
  {
    id: "bite_rush",
    name: "Ускоренный укус",
    description: "+35% bite damage на 10 секунд.",
    cost: { pearls: 95, corals: 1 },
    effect: "bite_boost",
    value: 0.35,
    duration: 10
  },
  {
    id: "sonar_ping",
    name: "Сонар",
    description: "Усиливает mini-map и показывает больше угроз на 16 секунд.",
    cost: { pearls: 60 },
    effect: "sonar",
    value: 1,
    duration: 16
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
  if (cost.pearls) parts.push(`${cost.pearls} жемчуг`);
  if (cost.corals) parts.push(`${cost.corals} коралл`);
  return parts.join(" · ") || "Бесплатно";
}
