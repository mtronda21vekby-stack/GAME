import type { NextEngineState } from "../core/engineTypes";
import { NEXT_ACHIEVEMENTS, type NextAchievementDefinition } from "../content/achievements";
import { getMutationTotalLevel } from "../content/mutations";
import { awardNextXp, syncProgressionStats } from "./progressionSystem";

function addFloat(state: NextEngineState, text: string) {
  state.floats.push({
    id: state.nextFloatId++,
    x: state.player.x,
    y: state.player.y - state.player.radius * 3.45,
    text,
    ttl: 1.35,
    kind: "kill"
  });
}

function achievementValue(state: NextEngineState, achievement: NextAchievementDefinition) {
  if (achievement.metric === "kills") return state.stats.kills;
  if (achievement.metric === "tier") return state.player.tier;
  if (achievement.metric === "level") return state.player.level;
  if (achievement.metric === "craft") return Math.max(state.stats.craftUses || 0, state.quests.counters?.craft || 0);
  if (achievement.metric === "resources") return Math.max(state.stats.resourcesCollected || 0, state.quests.counters?.resources || 0);
  if (achievement.metric === "mutations") return Math.max(state.quests.counters?.mutations || 0, getMutationTotalLevel(state.mutations));
  if (achievement.metric === "pearls") return state.economy.pearls;
  if (achievement.metric === "corals") return state.economy.corals;
  return 0;
}

function unlockAchievement(state: NextEngineState, achievement: NextAchievementDefinition) {
  state.achievements.unlocked[achievement.id] = true;
  state.economy.pearls += achievement.reward.pearls;
  state.economy.corals += achievement.reward.corals;
  awardNextXp(state, achievement.reward.xp);

  const rewardText = `+${achievement.reward.xp} XP +${achievement.reward.pearls} жемчуг${achievement.reward.corals ? ` +${achievement.reward.corals} кристалл` : ""}`;
  state.stats.lastEvent = `🏆 ${achievement.title} ${rewardText}`;
  addFloat(state, `🏆 ${achievement.title}`);
}

export function updateAchievementSystem(state: NextEngineState) {
  state.achievements.unlocked = state.achievements.unlocked || {};

  for (const achievement of NEXT_ACHIEVEMENTS) {
    if (state.achievements.unlocked[achievement.id]) continue;
    if (achievementValue(state, achievement) >= achievement.target) unlockAchievement(state, achievement);
  }

  state.stats.achievementsUnlocked = Object.keys(state.achievements.unlocked).length;
  syncProgressionStats(state);
}
