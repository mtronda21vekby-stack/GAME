export type NextQuestMetric = "kills" | "mass" | "level" | "tier" | "pearls" | "corals" | "resources" | "craft" | "mutations";

export type NextQuestScope = "story" | "daily" | "weekly";

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
  scope: NextQuestScope;
  directorTag?: string;
};

type QuestTemplate = Omit<NextQuestDefinition, "id" | "target" | "reward" | "scope"> & {
  id: string;
  targetMin: number;
  targetMax: number;
  reward: NextQuestReward;
};

export const QUEST_DIRECTOR_NAME = "Quest Director";

export const NEXT_STORY_QUESTS: NextQuestDefinition[] = [
  {
    id: "first_blood",
    title: "Первый корм",
    description: "Съешь или убей 1 врага.",
    metric: "kills",
    target: 1,
    reward: { xp: 60, pearls: 12, corals: 0 },
    scope: "story",
    directorTag: "tutorial"
  },
  {
    id: "small_predator",
    title: "Малый хищник",
    description: "Сделай 5 убийств.",
    metric: "kills",
    target: 5,
    reward: { xp: 140, pearls: 35, corals: 0 },
    scope: "story",
    directorTag: "combat"
  },
  {
    id: "mass_builder",
    title: "Набор массы",
    description: "Достигни Mass 3.0.",
    metric: "mass",
    target: 3,
    reward: { xp: 180, pearls: 40, corals: 0 },
    scope: "story",
    directorTag: "growth"
  },
  {
    id: "tier_two",
    title: "Первый скачок",
    description: "Достигни Tier 2.",
    metric: "tier",
    target: 2,
    reward: { xp: 120, pearls: 45, corals: 1 },
    scope: "story",
    directorTag: "growth"
  },
  {
    id: "level_five",
    title: "Первые уровни",
    description: "Достигни LV 5.",
    metric: "level",
    target: 5,
    reward: { xp: 220, pearls: 55, corals: 1 },
    scope: "story",
    directorTag: "growth"
  },
  {
    id: "pearl_bank",
    title: "Копилка жемчуга",
    description: "Накопи 150 жемчуга.",
    metric: "pearls",
    target: 150,
    reward: { xp: 220, pearls: 40, corals: 1 },
    scope: "story",
    directorTag: "economy"
  },
  {
    id: "shark_path",
    title: "Путь к акуле",
    description: "Достигни LV 30.",
    metric: "level",
    target: 30,
    reward: { xp: 520, pearls: 180, corals: 4 },
    scope: "story",
    directorTag: "evolution"
  }
];

const DAILY_TEMPLATES: QuestTemplate[] = [
  {
    id: "daily_hunt",
    title: "Охота дня",
    description: "Сделай убийства в текущем забеге.",
    metric: "kills",
    targetMin: 6,
    targetMax: 14,
    reward: { xp: 180, pearls: 180, corals: 1 },
    directorTag: "combat"
  },
  {
    id: "daily_pearls",
    title: "Жемчужный маршрут",
    description: "Подбери жемчужины на карте.",
    metric: "pearls",
    targetMin: 180,
    targetMax: 520,
    reward: { xp: 170, pearls: 160, corals: 1 },
    directorTag: "economy"
  },
  {
    id: "daily_crystals",
    title: "Кристальный след",
    description: "Подбери кристаллы-кораллы.",
    metric: "corals",
    targetMin: 2,
    targetMax: 5,
    reward: { xp: 240, pearls: 220, corals: 2 },
    directorTag: "premium"
  },
  {
    id: "daily_resources",
    title: "Сбор ресурсов",
    description: "Подбери ресурсы на карте.",
    metric: "resources",
    targetMin: 8,
    targetMax: 18,
    reward: { xp: 190, pearls: 150, corals: 1 },
    directorTag: "map"
  },
  {
    id: "daily_craft",
    title: "Крафт смены",
    description: "Используй крафт-рецепты.",
    metric: "craft",
    targetMin: 1,
    targetMax: 3,
    reward: { xp: 210, pearls: 130, corals: 1 },
    directorTag: "craft"
  },
  {
    id: "daily_mutation",
    title: "Клеточный апгрейд",
    description: "Улучши любую мутацию.",
    metric: "mutations",
    targetMin: 1,
    targetMax: 1,
    reward: { xp: 260, pearls: 180, corals: 2 },
    directorTag: "mutation"
  }
];

const WEEKLY_TEMPLATES: QuestTemplate[] = [
  {
    id: "weekly_apex_prep",
    title: "Неделя охотника",
    description: "Сделай серию убийств за неделю.",
    metric: "kills",
    targetMin: 45,
    targetMax: 85,
    reward: { xp: 1200, pearls: 1600, corals: 8 },
    directorTag: "combat"
  },
  {
    id: "weekly_treasure",
    title: "Казна глубин",
    description: "Собери много жемчуга за неделю.",
    metric: "pearls",
    targetMin: 2500,
    targetMax: 6500,
    reward: { xp: 1050, pearls: 2200, corals: 7 },
    directorTag: "economy"
  },
  {
    id: "weekly_crystal_bank",
    title: "Кристальный банк",
    description: "Собери кристаллы-кораллы за неделю.",
    metric: "corals",
    targetMin: 18,
    targetMax: 42,
    reward: { xp: 1450, pearls: 1800, corals: 12 },
    directorTag: "premium"
  },
  {
    id: "weekly_craft_line",
    title: "Мастерская рифа",
    description: "Используй крафт много раз.",
    metric: "craft",
    targetMin: 8,
    targetMax: 18,
    reward: { xp: 1150, pearls: 1450, corals: 7 },
    directorTag: "craft"
  },
  {
    id: "weekly_mutation_line",
    title: "Генная линия",
    description: "Прокачай мутации за неделю.",
    metric: "mutations",
    targetMin: 3,
    targetMax: 7,
    reward: { xp: 1500, pearls: 1750, corals: 10 },
    directorTag: "mutation"
  },
  {
    id: "weekly_resource_sweep",
    title: "Чистка карты",
    description: "Подбери много ресурсов за неделю.",
    metric: "resources",
    targetMin: 60,
    targetMax: 120,
    reward: { xp: 1100, pearls: 1500, corals: 7 },
    directorTag: "map"
  }
];

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekKey(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.floor((days + start.getDay()) / 7) + 1;
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: string) {
  let x = hash(seed) || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

function pickTemplates(scope: NextQuestScope, key: string, count: number) {
  const source = scope === "daily" ? DAILY_TEMPLATES : WEEKLY_TEMPLATES;
  const random = rand(`${scope}:${key}`);
  return [...source]
    .map((template) => ({ template, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map((item) => item.template);
}

function buildQuest(template: QuestTemplate, scope: NextQuestScope, key: string, index: number): NextQuestDefinition {
  const random = rand(`${scope}:${key}:${template.id}:${index}`);
  const span = Math.max(0, template.targetMax - template.targetMin);
  const target = Math.round(template.targetMin + random() * span);
  const rewardBoost = scope === "weekly" ? 1.35 : 1;
  return {
    id: `${scope}_${key}_${template.id}`,
    title: scope === "daily" ? `Daily: ${template.title}` : `Weekly: ${template.title}`,
    description: `${QUEST_DIRECTOR_NAME}: ${template.description}`,
    metric: template.metric,
    target,
    reward: {
      xp: Math.round(template.reward.xp * rewardBoost),
      pearls: Math.round(template.reward.pearls * rewardBoost),
      corals: Math.round(template.reward.corals * rewardBoost)
    },
    scope,
    directorTag: template.directorTag
  };
}

export function getDailyQuestKey(date = new Date()) {
  return localDateKey(date);
}

export function getWeeklyQuestKey(date = new Date()) {
  return weekKey(date);
}

export function buildQuestBoard(date = new Date()) {
  const dailyKey = getDailyQuestKey(date);
  const weeklyKey = getWeeklyQuestKey(date);
  const daily = pickTemplates("daily", dailyKey, 3).map((template, index) => buildQuest(template, "daily", dailyKey, index));
  const weekly = pickTemplates("weekly", weeklyKey, 3).map((template, index) => buildQuest(template, "weekly", weeklyKey, index));
  return {
    dailyKey,
    weeklyKey,
    story: NEXT_STORY_QUESTS,
    daily,
    weekly,
    all: [...daily, ...weekly, ...NEXT_STORY_QUESTS],
    directorFocus: daily[0]?.directorTag || weekly[0]?.directorTag || "balanced"
  };
}

export const NEXT_QUESTS: NextQuestDefinition[] = buildQuestBoard().all;

export function getQuestById(id: string) {
  return buildQuestBoard().all.find((quest) => quest.id === id);
}
