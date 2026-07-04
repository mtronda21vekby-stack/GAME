import { DARK_CAVE_ARTIFACTS_REQUIRED, DARK_CAVE_MIN_LEVEL } from "../assets/visuals/visualCatalog";

export type DarkCaveStoryStepId = "reach_level" | "find_artifacts" | "open_portal" | "enter_cave" | "read_echo" | "return_ocean";

export type DarkCaveStoryStep = {
  id: DarkCaveStoryStepId;
  title: string;
  objective: string;
  description: string;
};

export const DARK_CAVE_STORY_TITLE = "Тайна неоновой пещеры";

export const DARK_CAVE_STORY_STEPS: DarkCaveStoryStep[] = [
  {
    id: "reach_level",
    title: "Глубинный порог",
    objective: `Достигни ${DARK_CAVE_MIN_LEVEL} уровня, чтобы древний портал начал реагировать.`,
    description: "Пещера не открывается раньше: рыбе нужно достаточно силы для глубинного перехода."
  },
  {
    id: "find_artifacts",
    title: "Древние раковины",
    objective: `Найди ${DARK_CAVE_ARTIFACTS_REQUIRED} спрятанных артефакта на основной карте.`,
    description: "Артефактов ровно три. Они не спавнятся повторно и спрятаны в разных частях океана."
  },
  {
    id: "open_portal",
    title: "Пробуждение портала",
    objective: "Доплыви до портала тёмной пещеры.",
    description: `Портал откроется только если есть ${DARK_CAVE_ARTIFACTS_REQUIRED}/3 артефакта и уровень не ниже ${DARK_CAVE_MIN_LEVEL}.`
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

export function darkCaveStoryStep(artifactsFound = 0, inDarkCave = false, playerLevel = 1) {
  if (inDarkCave) return DARK_CAVE_STORY_STEPS.find((step) => step.id === "read_echo") || DARK_CAVE_STORY_STEPS[0];
  if (Math.max(1, Math.floor(playerLevel || 1)) < DARK_CAVE_MIN_LEVEL) return DARK_CAVE_STORY_STEPS.find((step) => step.id === "reach_level") || DARK_CAVE_STORY_STEPS[0];
  if (Math.max(0, Math.floor(artifactsFound || 0)) < DARK_CAVE_ARTIFACTS_REQUIRED) return DARK_CAVE_STORY_STEPS.find((step) => step.id === "find_artifacts") || DARK_CAVE_STORY_STEPS[0];
  return DARK_CAVE_STORY_STEPS.find((step) => step.id === "open_portal") || DARK_CAVE_STORY_STEPS[0];
}
