export type NextQuestMetric = "kills" | "mass" | "level" | "tier" | "pearls" | "corals";

export type NextQuestReward = {
  xp: number;
  pearls: number;
  corals: number;
};

export type NextQuestDefinition = {
  id: string;
  title: string;
  description: string;
  metric: NextQuestMetric;
  target: number;
  reward: NextQuestReward;
};

export const NEXT_QUESTS: NextQuestDefinition[] = [
  {
    id: "first_blood",
    title: "Первый корм",
    description: "Съешь или убей 1 врага.",
    metric: "kills",
    target: 1,
    reward: { xp: 60, pearls: 12, corals: 0 }
  },
  {
    id: "small_predator",
    title: "Малый хищник",
    description: "Сделай 5 убийств.",
    metric: "kills",
    target: 5,
    reward: { xp: 140, pearls: 35, corals: 0 }
  },
  {
    id: "mass_builder",
    title: "Набор массы",
    description: "Достигни Mass 3.0.",
    metric: "mass",
    target: 3,
    reward: { xp: 180, pearls: 40, corals: 0 }
  },
  {
    id: "tier_two",
    title: "Первый скачок",
    description: "Достигни Tier 2.",
    metric: "tier",
    target: 2,
    reward: { xp: 120, pearls: 45, corals: 1 }
  },
  {
    id: "level_five",
    title: "Первые уровни",
    description: "Достигни LV 5.",
    metric: "level",
    target: 5,
    reward: { xp: 220, pearls: 55, corals: 1 }
  },
  {
    id: "pearl_bank",
    title: "Копилка жемчуга",
    description: "Накопи 150 жемчуга.",
    metric: "pearls",
    target: 150,
    reward: { xp: 220, pearls: 40, corals: 1 }
  },
  {
    id: "shark_path",
    title: "Путь к акуле",
    description: "Достигни LV 30.",
    metric: "level",
    target: 30,
    reward: { xp: 520, pearls: 180, corals: 4 }
  }
];

export function getQuestById(id: string) {
  return NEXT_QUESTS.find((quest) => quest.id === id);
}
