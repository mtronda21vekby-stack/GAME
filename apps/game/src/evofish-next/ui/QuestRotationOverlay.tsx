import React, { useEffect } from "react";
import { buildQuestBoard, getDailyQuestKey, getWeeklyQuestKey } from "../content/quests";
import { loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";

const QUEST_ROTATION_RELOAD_KEY = "evofish_next_quest_rotation_reload_v1";

function removeCompletedByPrefix(completed: Record<string, boolean>, prefix: "daily_" | "weekly_") {
  const next: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(completed || {})) {
    if (!id.startsWith(prefix)) next[id] = value;
  }
  return next;
}

function baselineForMetric(counters: Record<string, number>, metric: string) {
  return Math.max(0, Math.floor(counters?.[metric] || 0));
}

function syncQuestRotation() {
  const now = new Date();
  const dailyKey = getDailyQuestKey(now);
  const weeklyKey = getWeeklyQuestKey(now);
  const save = loadEvoFishNextSave();
  const quests = save.quests;
  const dailyChanged = quests.dailyKey !== dailyKey;
  const weeklyChanged = quests.weeklyKey !== weeklyKey;

  if (!dailyChanged && !weeklyChanged) return false;

  const board = buildQuestBoard(now);
  const counters = { ...(quests.counters || {}) };
  let completed = { ...(quests.completed || {}) };
  const baselines = { ...(quests.baselines || {}) };

  if (dailyChanged) {
    completed = removeCompletedByPrefix(completed, "daily_");
    for (const id of Object.keys(baselines)) {
      if (id.startsWith("daily_")) delete baselines[id];
    }
    for (const quest of board.daily) {
      baselines[quest.id] = baselineForMetric(counters, quest.metric);
    }
  }

  if (weeklyChanged) {
    completed = removeCompletedByPrefix(completed, "weekly_");
    for (const id of Object.keys(baselines)) {
      if (id.startsWith("weekly_")) delete baselines[id];
    }
    for (const quest of board.weekly) {
      baselines[quest.id] = baselineForMetric(counters, quest.metric);
    }
  }

  saveEvoFishNextSave({
    ...save,
    quests: {
      ...quests,
      completed,
      baselines,
      counters,
      dailyKey,
      weeklyKey,
      directorFocus: board.directorFocus
    }
  });

  return true;
}

function reloadOnceForRotation() {
  const stamp = `${getDailyQuestKey()}|${getWeeklyQuestKey()}`;
  let lastReload = "";
  try {
    lastReload = sessionStorage.getItem(QUEST_ROTATION_RELOAD_KEY) || "";
  } catch {
    // sessionStorage is optional
  }

  if (lastReload === stamp) return;
  try {
    sessionStorage.setItem(QUEST_ROTATION_RELOAD_KEY, stamp);
  } catch {
    // sessionStorage is optional
  }
  window.location.reload();
}

export function QuestRotationOverlay() {
  useEffect(() => {
    const check = () => {
      if (syncQuestRotation()) reloadOnceForRotation();
    };

    check();
    const timer = window.setInterval(check, 60_000);
    const onFocus = () => check();
    const onVisible = () => { if (!document.hidden) check(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
