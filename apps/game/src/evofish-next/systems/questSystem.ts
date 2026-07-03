import type { NextEngineState } from "../core/engineTypes";
import { buildQuestBoard, type NextQuestDefinition, type NextQuestScope } from "../content/quests";
import { getMutationTotalLevel } from "../content/mutations";
import { awardNextXp, syncProgressionStats } from "./progressionSystem";

function addFloat(state: NextEngineState, x: number, y: number, text: string) {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 1.15, kind: "kill" });
}

function scopeLabel(scope: NextQuestScope) {
  if (scope === "daily") return "Daily";
  if (scope === "weekly") return "Weekly";
  return "Quest";
}

function questCounter(state: NextEngineState, key: string) {
  return Math.max(0, Math.floor(state.quests.counters?.[key] || 0));
}

function questValue(state: NextEngineState, quest: NextQuestDefinition) {
  if (quest.metric === "kills") return state.stats.kills;
  if (quest.metric === "mass") return state.player.mass;
  if (quest.metric === "level") return state.player.level;
  if (quest.metric === "tier") return state.player.tier;
  if (quest.metric === "pearls") return state.economy.pearls;
  if (quest.metric === "corals") return state.economy.corals;
  if (quest.metric === "resources") return Math.max(state.stats.resourcesCollected || 0, questCounter(state, "resources"));
  if (quest.metric === "craft") return Math.max(state.stats.craftUses || 0, questCounter(state, "craft"));
  if (quest.metric === "mutations") return Math.max(state.stats.mutationPurchases || 0, getMutationTotalLevel(state.mutations));
  return 0;
}

function ensureQuestDirectorState(state: NextEngineState) {
  const board = buildQuestBoard();
  state.quests.baselines = state.quests.baselines || {};
  state.quests.counters = state.quests.counters || {};

  if (state.quests.dailyKey !== board.dailyKey) {
    state.quests.dailyKey = board.dailyKey;
    for (const key of Object.keys(state.quests.baselines)) {
      if (key.startsWith("daily_")) delete state.quests.baselines[key];
    }
  }

  if (state.quests.weeklyKey !== board.weeklyKey) {
    state.quests.weeklyKey = board.weeklyKey;
    for (const key of Object.keys(state.quests.baselines)) {
      if (key.startsWith("weekly_")) delete state.quests.baselines[key];
    }
  }

  state.quests.directorFocus = board.directorFocus;
  state.stats.dailyQuestKey = board.dailyKey;
  state.stats.weeklyQuestKey = board.weeklyKey;
  state.stats.questDirectorFocus = board.directorFocus;
  return board;
}

function isQuestCompleted(state: NextEngineState, quest: NextQuestDefinition) {
  return Boolean(state.quests.completed[quest.id]);
}

function questProgress(state: NextEngineState, quest: NextQuestDefinition) {
  const raw = questValue(state, quest);
  if (quest.scope === "story") return raw;

  state.quests.baselines = state.quests.baselines || {};
  if (state.quests.baselines[quest.id] === undefined) {
    state.quests.baselines[quest.id] = raw;
    return 0;
  }

  return Math.max(0, raw - state.quests.baselines[quest.id]);
}

function activeQuest(state: NextEngineState, quests: NextQuestDefinition[]) {
  return quests.find((quest) => !isQuestCompleted(state, quest)) || quests[quests.length - 1];
}

function completeQuest(state: NextEngineState, quest: NextQuestDefinition) {
  state.quests.completed[quest.id] = true;
  state.economy.pearls += quest.reward.pearls;
  state.economy.corals += quest.reward.corals;
  awardNextXp(state, quest.reward.xp);
  state.stats.lastEvent = `${scopeLabel(quest.scope)}: ${quest.title} +${quest.reward.xp} XP +${quest.reward.pearls} жемчуг${quest.reward.corals ? ` +${quest.reward.corals} кристалл` : ""}`;
  addFloat(state, state.player.x, state.player.y - state.player.radius * 3.1, `${scopeLabel(quest.scope).toUpperCase()}: ${quest.title}`);
}

export function syncQuestStats(state: NextEngineState) {
  const board = ensureQuestDirectorState(state);
  const quest = activeQuest(state, board.all);
  const value = quest ? questProgress(state, quest) : 0;

  state.stats.completedQuests = Object.keys(state.quests.completed).length;
  state.stats.activeQuestTitle = quest ? `${scopeLabel(quest.scope)}: ${quest.title}` : "Все задания выполнены";
  state.stats.activeQuestProgress = Math.min(quest?.target || 1, value);
  state.stats.activeQuestTarget = quest?.target || 1;
}

export function updateQuestSystem(state: NextEngineState) {
  const board = ensureQuestDirectorState(state);

  for (const quest of board.all) {
    if (isQuestCompleted(state, quest)) continue;
    if (questProgress(state, quest) >= quest.target) completeQuest(state, quest);
  }

  syncProgressionStats(state);
  syncQuestStats(state);
}
