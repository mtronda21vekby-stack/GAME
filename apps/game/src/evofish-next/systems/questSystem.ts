import type { NextEngineState } from "../core/engineTypes";
import { NEXT_QUESTS, type NextQuestDefinition } from "../content/quests";
import { awardNextXp, syncProgressionStats } from "./progressionSystem";

function addFloat(state: NextEngineState, x: number, y: number, text: string) {
  state.floats.push({ id: state.nextFloatId++, x, y, text, ttl: 1.15, kind: "kill" });
}

function questValue(state: NextEngineState, quest: NextQuestDefinition) {
  if (quest.metric === "kills") return state.stats.kills;
  if (quest.metric === "mass") return state.player.mass;
  if (quest.metric === "level") return state.player.level;
  if (quest.metric === "tier") return state.player.tier;
  if (quest.metric === "pearls") return state.economy.pearls;
  if (quest.metric === "corals") return state.economy.corals;
  return 0;
}

function activeQuest(state: NextEngineState) {
  return NEXT_QUESTS.find((quest) => !state.quests.completed[quest.id]) || NEXT_QUESTS[NEXT_QUESTS.length - 1];
}

function completeQuest(state: NextEngineState, quest: NextQuestDefinition) {
  state.quests.completed[quest.id] = true;
  state.economy.pearls += quest.reward.pearls;
  state.economy.corals += quest.reward.corals;
  awardNextXp(state, quest.reward.xp);
  state.stats.lastEvent = `Quest: ${quest.title} +${quest.reward.xp} XP +${quest.reward.pearls} жемчуг${quest.reward.corals ? ` +${quest.reward.corals} коралл` : ""}`;
  addFloat(state, state.player.x, state.player.y - state.player.radius * 3.1, `QUEST: ${quest.title}`);
}

export function syncQuestStats(state: NextEngineState) {
  const quest = activeQuest(state);
  const value = quest ? questValue(state, quest) : 0;

  state.stats.completedQuests = Object.keys(state.quests.completed).length;
  state.stats.activeQuestTitle = quest?.title || "Все задания выполнены";
  state.stats.activeQuestProgress = Math.min(quest?.target || 1, value);
  state.stats.activeQuestTarget = quest?.target || 1;
}

export function updateQuestSystem(state: NextEngineState) {
  for (const quest of NEXT_QUESTS) {
    if (state.quests.completed[quest.id]) continue;
    if (questValue(state, quest) >= quest.target) completeQuest(state, quest);
  }

  syncProgressionStats(state);
  syncQuestStats(state);
}
