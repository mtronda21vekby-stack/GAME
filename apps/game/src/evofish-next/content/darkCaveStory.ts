export type DarkCaveStoryStepId = "find_artifacts" | "open_portal" | "enter_cave" | "read_echo" | "return_ocean";

export type DarkCaveStoryStep = {
  id: DarkCaveStoryStepId;
  title: string;
  objective: string;
  description: string;
};

export const DARK_CAVE_STORY_TITLE = "Тайна неоновой пещеры";

export const DARK_CAVE_STORY_STEPS: DarkCaveStoryStep[] = [
  {
    id: "find_artifacts",
    title: "Древние раковины",
    objective: "Найди 3 спрятанных артефакта на основной карте.",
    description: "Осколки древней раковины реагируют на глубинный портал."
  },
  {
    id: "open_portal",
    title: "Пробуждение портала",
    objective: "Доплыви до портала тёмной пещеры.",
    description: "Когда 3 артефакта собраны, портал начинает светиться неоном."
  },
  {
    id: "enter_cave",
    title: "Вход в бездну",
    objective: "Зайди в портал и дождись загрузки нового мира.",
    description: "Переход спокойный: движение замедляется, экран показывает загрузку."
  },
  {
    id: "read_echo",
    title: "Неоновое эхо",
    objective: "Исследуй тёмную пещеру и найди источник свечения.",
    description: "Внутри пещеры вода темнее, а ориентиры светятся холодным неоном."
  },
  {
    id: "return_ocean",
    title: "Возвращение",
    objective: "Вернись через обратный портал в основной океан.",
    description: "Портал назад всегда доступен внутри пещеры."
  }
];

export function darkCaveStoryStep(artifactsFound = 0, inDarkCave = false) {
  if (inDarkCave) return DARK_CAVE_STORY_STEPS.find((step) => step.id === "read_echo") || DARK_CAVE_STORY_STEPS[0];
  if (artifactsFound >= 3) return DARK_CAVE_STORY_STEPS.find((step) => step.id === "open_portal") || DARK_CAVE_STORY_STEPS[0];
  return DARK_CAVE_STORY_STEPS[0];
}
