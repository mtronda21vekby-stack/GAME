export type BetaChecklistStatus = "todo" | "done" | "issue";
export type BetaChecklistPriority = "P0" | "P1" | "P2";

export type BetaChecklistItem = {
  id: string;
  priority: BetaChecklistPriority;
  title: string;
  description: string;
  gate: string;
};

export const EVOFISH_BETA_CHECKLIST_VERSION = "beta-checklist-v2-cache";

export const EVOFISH_BETA_CHECKLIST: BetaChecklistItem[] = [
  {
    id: "routes",
    priority: "P0",
    title: "Stable beta routes",
    description: "Проверить /game, /game/play, /game/checklist, /game/cache, /game/progress, /game/repair, /game/qa, /game/report, /game/skins, /game/classic.",
    gate: "Все маршруты открываются без белого экрана."
  },
  {
    id: "error_guard",
    priority: "P0",
    title: "Error Guard",
    description: "Game Error должен давать Reload, Restart Run, Repair Save, Beta Home, Save Doctor, Cache Doctor и Report Bug.",
    gate: "Игрок не видит пустой экран при runtime crash."
  },
  {
    id: "cache_doctor",
    priority: "P0",
    title: "Cache Doctor",
    description: "Inspect, Clean Game Cache, Reset Local Settings, Fresh Reload и Copy Report должны работать на iPhone Safari.",
    gate: "Игрок может выбить старый кэш и получить свежий билд после деплоя."
  },
  {
    id: "save_doctor",
    priority: "P0",
    title: "Save Doctor",
    description: "Inspect, Repair Save, Reset Run и Reset Progress Keep Skins должны сохранять кошелёк, аккаунт и купленные скины.",
    gate: "Старый/битый save не ломает запуск игры."
  },
  {
    id: "mobile_controls",
    priority: "P0",
    title: "Mobile controls",
    description: "Проверить Touch, Stick Fixed, Stick Floating, Stick Size, Sensitivity, Bite/Dash, Lock UI на iPhone Safari.",
    gate: "Управление не крашит игру и не конфликтует с браузером."
  },
  {
    id: "settings_persist",
    priority: "P0",
    title: "Settings persist",
    description: "RU/EN, Quality, Auto Zoom, Manual Zoom и Stick настройки сохраняются после перезахода.",
    gate: "Настройки не сбрасываются и не вызывают currentTarget/value crash."
  },
  {
    id: "first_run_tutorial",
    priority: "P1",
    title: "First run tutorial",
    description: "Первый запуск показывает 5 шагов: движение, bite/dash, ресурсы, задания, мутации.",
    gate: "Новый игрок понимает первые 2–3 минуты игры."
  },
  {
    id: "progress_visibility",
    priority: "P1",
    title: "Progress visibility",
    description: "Progress Hub показывает Save Doctor, Daily/Weekly/Story, достижения, pickups, mutations и balance targets.",
    gate: "Игрок видит, зачем фармить и что открывать дальше."
  },
  {
    id: "economy_balance",
    priority: "P1",
    title: "Economy balance",
    description: "Цель: 800–1300 жемчуга/10 мин, 1–3 кристалла/10 мин, первый premium skin 8–12 мин, первая мутация 10–15 мин.",
    gate: "Экономика не слишком быстрая и не слишком душная."
  },
  {
    id: "skin_lab",
    priority: "P1",
    title: "Skin Lab / Shop",
    description: "Покупка, надевание, locked reasons и формы fish/shark/megalodon работают без потери прогресса.",
    gate: "Косметика работает как основной retention-layer."
  },
  {
    id: "qa_report",
    priority: "P2",
    title: "QA + Report flow",
    description: "QA Pass сохраняет PASS/FAIL/TODO, Copy QA Report копирует JSON, Report Bug копирует короткий bug report.",
    gate: "Тестирование можно проводить без ручного копания в консоли."
  },
  {
    id: "visual_polish",
    priority: "P2",
    title: "Premium visual pass",
    description: "Главные beta-экраны выглядят как единый BlackCrown flow: beta home, checklist, cache, progress, QA, report, skins.",
    gate: "UI не выглядит как временная dev-панель."
  },
  {
    id: "classic_fallback",
    priority: "P2",
    title: "Classic fallback",
    description: "Classic доступен, но не мешает beta-flow и не становится основным маршрутом.",
    gate: "Есть безопасный fallback, но beta остаётся главным режимом."
  }
];
