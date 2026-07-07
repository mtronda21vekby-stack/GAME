import type { EvoFishCurrency } from "../core/types";

export type NextCraftEffect = "heal" | "barrier" | "bite_boost" | "sonar" | "cleanse" | "overdrive";

export type NextCraftCost = Partial<Record<EvoFishCurrency, number>>;

export type NextCraftRecipe = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  cost: NextCraftCost;
  effect: NextCraftEffect;
  value: number;
  duration: number;
  maxStack?: number;
};

export type NextCraftInventory = Record<string, number>;

export type NextCraftState = {
  barrierT: number;
  biteBoostT: number;
  sonarT: number;
  overdriveT: number;
  inventory: NextCraftInventory;
};

export const NEXT_CRAFT_RECIPES: NextCraftRecipe[] = [
  {
    id: "heal_gel",
    name: "Лечебный гель",
    shortName: "HP",
    description: "Мгновенно восстанавливает 38% HP. Дешёвый аварийный предмет для поздней игры.",
    cost: { pearls: 70 },
    effect: "heal",
    value: 0.38,
    duration: 0,
    maxStack: 99
  },
  {
    id: "reef_barrier",
    name: "Рифовый барьер",
    shortName: "Щит",
    description: "Даёт защиту на 10 секунд. Хорошо против толпы и элиты.",
    cost: { pearls: 125, corals: 1 },
    effect: "barrier",
    value: 1,
    duration: 10,
    maxStack: 99
  },
  {
    id: "bite_rush",
    name: "Ускоренный укус",
    shortName: "Укус",
    description: "+34% bite damage на 14 секунд. Для охоты и боссов.",
    cost: { pearls: 115, corals: 1 },
    effect: "bite_boost",
    value: 0.34,
    duration: 14,
    maxStack: 99
  },
  {
    id: "sonar_ping",
    name: "Сонар",
    shortName: "Сонар",
    description: "Усиливает mini-map и помогает видеть угрозы/ресурсы на 24 секунды.",
    cost: { pearls: 65 },
    effect: "sonar",
    value: 1,
    duration: 24,
    maxStack: 99
  },
  {
    id: "cleanse_bubble",
    name: "Чистая сфера",
    shortName: "Cleanse",
    description: "Снимает давление: короткое окно безопасности, сброс dash cooldown и лёгкий heal.",
    cost: { pearls: 140, corals: 1 },
    effect: "cleanse",
    value: 0.18,
    duration: 1.6,
    maxStack: 99
  },
  {
    id: "apex_overdrive",
    name: "Апекс-режим",
    shortName: "Apex",
    description: "Короткий премиум-буст: bite, dash и безопасность на 8 секунд. Дорого, но мощно.",
    cost: { pearls: 260, corals: 2 },
    effect: "overdrive",
    value: 0.5,
    duration: 8,
    maxStack: 99
  }
];

export function normalizeCraftInventory(inventory?: Partial<NextCraftInventory> | null): NextCraftInventory {
  const next: NextCraftInventory = {};
  for (const recipe of NEXT_CRAFT_RECIPES) {
    next[recipe.id] = Math.max(0, Math.min(recipe.maxStack || 99, Math.floor(Number(inventory?.[recipe.id] || 0))));
  }
  return next;
}

export function normalizeCraftState(craft?: Partial<NextCraftState> | null): NextCraftState {
  return {
    barrierT: Math.max(0, Number(craft?.barrierT || 0)),
    biteBoostT: Math.max(0, Number(craft?.biteBoostT || 0)),
    sonarT: Math.max(0, Number(craft?.sonarT || 0)),
    overdriveT: Math.max(0, Number(craft?.overdriveT || 0)),
    inventory: normalizeCraftInventory(craft?.inventory)
  };
}

export function defaultCraftState(): NextCraftState {
  return normalizeCraftState();
}

export function getCraftCostLabel(cost: NextCraftCost) {
  const parts: string[] = [];
  if (cost.pearls) parts.push(`🦪 ${cost.pearls} жемчуг`);
  if (cost.corals) parts.push(`💎 ${cost.corals} кристалл`);
  return parts.join(" · ") || "Бесплатно";
}
