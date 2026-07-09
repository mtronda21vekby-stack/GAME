export type NextAchievementMetric = "kills" | "tier" | "level" | "craft" | "resources" | "mutations" | "pearls" | "corals" | "perks" | "artifacts";

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
    id: "kills_500",
    title: "Охотник глубин",
    description: "Сделай 500 убийств за карьеру.",
    metric: "kills",
    target: 500,
    reward: { xp: 3600, pearls: 6500, corals: 12 }
  },
  {
    id: "kills_1000",
    title: "Легенда океана",
    description: "Сделай 1000 убийств и докажи, что ты апекс-хищник.",
    metric: "kills",
    target: 1000,
    reward: { xp: 8200, pearls: 18000, corals: 28 }
  },
  {
    id: "first_perk",
    title: "Перк найден",
    description: "Подбери первый временный perk.",
    metric: "perks",
    target: 1,
    reward: { xp: 140, pearls: 120, corals: 0 }
  },
  {
    id: "perks_30",
    title: "Перк-машина",
    description: "Подбери 30 временных perks.",
    metric: "perks",
    target: 30,
    reward: { xp: 1300, pearls: 1500, corals: 4 }
  },
  {
    id: "perks_100",
    title: "Тактический инстинкт",
    description: "Подбери 100 временных perks.",
    metric: "perks",
    target: 100,
    reward: { xp: 3600, pearls: 5200, corals: 10 }
  },
  {
    id: "artifact_1",
    title: "Древняя раковина",
    description: "Найди первую древнюю раковину.",
    metric: "artifacts",
    target: 1,
    reward: { xp: 520, pearls: 520, corals: 2 }
  },
  {
    id: "artifacts_5",
    title: "Археолог глубин",
    description: "Найди 5 древних раковин.",
    metric: "artifacts",
    target: 5,
    reward: { xp: 2200, pearls: 2600, corals: 8 }
  },
  {
    id: "artifacts_12",
    title: "Ключ к бездне",
    description: "Найди 12 древних артефактов.",
    metric: "artifacts",
    target: 12,
    reward: { xp: 6200, pearls: 9500, corals: 22 }
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
    id: "lvl_45",
    title: "Вход в тёмную зону",
    description: "Достигни LV 45 — порог поздней игры и DARK CAVE.",
    metric: "level",
    target: 45,
    reward: { xp: 2800, pearls: 4200, corals: 8 }
  },
  {
    id: "lvl_50_shark",
    title: "Акула!",
    description: "Достигни LV 50 и открой форму акулы.",
    metric: "level",
    target: 50,
    reward: { xp: 3600, pearls: 5200, corals: 10 }
  },
  {
    id: "lvl_80",
    title: "Повелитель разлома",
    description: "Достигни LV 80 и закрепись в endgame-зонах.",
    metric: "level",
    target: 80,
    reward: { xp: 7600, pearls: 14500, corals: 24 }
  },
  {
    id: "lvl_100_megalodon",
    title: "Мегалодон!",
    description: "Достигни LV 100 и открой форму мегалодона.",
    metric: "level",
    target: 100,
    reward: { xp: 14000, pearls: 32000, corals: 48 }
  },
  {
    id: "lvl_120_ocean_king",
    title: "Король океана",
    description: "Достигни LV 120. Это верхний рубеж текущей endgame-прогрессии.",
    metric: "level",
    target: 120,
    reward: { xp: 22000, pearls: 56000, corals: 72 }
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
    id: "craft_50",
    title: "Инженер глубин",
    description: "Используй крафт 50 раз.",
    metric: "craft",
    target: 50,
    reward: { xp: 3300, pearls: 4400, corals: 10 }
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
    id: "resources_300",
    title: "Жемчужный маршрут",
    description: "Подбери 300 ресурсов.",
    metric: "resources",
    target: 300,
    reward: { xp: 4200, pearls: 7600, corals: 12 }
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
    id: "mutations_18",
    title: "Генетический апгрейд",
    description: "Набери 18 уровней мутаций.",
    metric: "mutations",
    target: 18,
    reward: { xp: 5200, pearls: 9000, corals: 18 }
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
    id: "pearls_100000",
    title: "Казна океана",
    description: "Накопи 100 000 жемчуга.",
    metric: "pearls",
    target: 100000,
    reward: { xp: 7200, pearls: 12000, corals: 20 }
  },
  {
    id: "corals_25",
    title: "Кристальный фонд",
    description: "Накопи 25 кристаллов.",
    metric: "corals",
    target: 25,
    reward: { xp: 1500, pearls: 1200, corals: 4 }
  },
  {
    id: "corals_150",
    title: "Кристальный монополист",
    description: "Накопи 150 кристаллов.",
    metric: "corals",
    target: 150,
    reward: { xp: 9500, pearls: 18000, corals: 30 }
  }
];
