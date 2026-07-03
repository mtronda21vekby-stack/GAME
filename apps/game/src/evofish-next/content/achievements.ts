export type NextAchievementMetric = "kills" | "tier" | "level" | "craft" | "resources" | "mutations" | "pearls" | "corals";

export type NextAchievementReward = {
  xp: number;
  pearls: number;
  corals: number;
};

export type NextAchievementDefinition = {
  id: string;
  title: string;
  description: string;
  metric: NextAchievementMetric;
  target: number;
  reward: NextAchievementReward;
};

export type NextAchievementState = {
  unlocked: Record<string, true>;
};

export function defaultAchievementState(): NextAchievementState {
  return { unlocked: {} };
}

export const NEXT_ACHIEVEMENTS: NextAchievementDefinition[] = [
  {
    id: "first_kill",
    title: "Первая кровь",
    description: "Убей первую рыбу.",
    metric: "kills",
    target: 1,
    reward: { xp: 80, pearls: 40, corals: 0 }
  },
  {
    id: "kills_25",
    title: "Разминка",
    description: "Сделай 25 убийств.",
    metric: "kills",
    target: 25,
    reward: { xp: 260, pearls: 220, corals: 1 }
  },
  {
    id: "kills_200",
    title: "Мясорубка",
    description: "Сделай 200 убийств.",
    metric: "kills",
    target: 200,
    reward: { xp: 1600, pearls: 1800, corals: 5 }
  },
  {
    id: "tier_5",
    title: "Хищник",
    description: "Достигни Tier 5.",
    metric: "tier",
    target: 5,
    reward: { xp: 420, pearls: 360, corals: 1 }
  },
  {
    id: "tier_10",
    title: "Апекс",
    description: "Достигни Tier 10.",
    metric: "tier",
    target: 10,
    reward: { xp: 1100, pearls: 1100, corals: 4 }
  },
  {
    id: "lvl_10",
    title: "Опытный",
    description: "Достигни LV 10.",
    metric: "level",
    target: 10,
    reward: { xp: 500, pearls: 420, corals: 1 }
  },
  {
    id: "lvl_30",
    title: "Акула!",
    description: "Достигни LV 30 и открой акулу.",
    metric: "level",
    target: 30,
    reward: { xp: 1600, pearls: 1450, corals: 4 }
  },
  {
    id: "lvl_60",
    title: "Мегалодон!",
    description: "Достигни LV 60 и открой мегалодона.",
    metric: "level",
    target: 60,
    reward: { xp: 4200, pearls: 5200, corals: 10 }
  },
  {
    id: "craft_1",
    title: "Первый крафт",
    description: "Используй крафт 1 раз.",
    metric: "craft",
    target: 1,
    reward: { xp: 180, pearls: 180, corals: 0 }
  },
  {
    id: "craft_10",
    title: "Ремесленник",
    description: "Используй крафт 10 раз.",
    metric: "craft",
    target: 10,
    reward: { xp: 900, pearls: 900, corals: 3 }
  },
  {
    id: "resources_50",
    title: "Сборщик рифа",
    description: "Подбери 50 ресурсов.",
    metric: "resources",
    target: 50,
    reward: { xp: 620, pearls: 650, corals: 2 }
  },
  {
    id: "mutations_6",
    title: "Мутант",
    description: "Набери 6 уровней мутаций.",
    metric: "mutations",
    target: 6,
    reward: { xp: 900, pearls: 850, corals: 3 }
  },
  {
    id: "pearls_5000",
    title: "Жемчужная казна",
    description: "Накопи 5 000 жемчуга.",
    metric: "pearls",
    target: 5000,
    reward: { xp: 1200, pearls: 750, corals: 2 }
  },
  {
    id: "corals_25",
    title: "Кристальный фонд",
    description: "Накопи 25 кристаллов.",
    metric: "corals",
    target: 25,
    reward: { xp: 1500, pearls: 1200, corals: 4 }
  }
];
