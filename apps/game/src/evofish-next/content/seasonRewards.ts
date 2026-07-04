export type EvoFishSeasonRewardTier = {
  id: string;
  title: string;
  placement: string;
  requirement: string;
  rewards: string[];
  spotlight: string;
};

export type EvoFishSeasonDefinition = {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  board: string;
  description: string;
  rewards: EvoFishSeasonRewardTier[];
  goals: string[];
};

export const EVOFISH_SEASON_1: EvoFishSeasonDefinition = {
  id: "season_1_neon_abyss",
  title: "Season 1: Neon Abyss",
  subtitle: "Live-рейтинг, Dark Cave и первые сезонные награды.",
  theme: "Neon Abyss",
  board: "world",
  description: "Соревнуйся в live TOP 100. Чем выше место в конце сезона, тем лучше косметические награды.",
  rewards: [
    {
      id: "top_1",
      title: "Abyss Champion",
      placement: "TOP 1",
      requirement: "Занять первое место сезона",
      rewards: ["Golden Leviathan Skin", "Abyss Crown Frame", "10 000 жемчуга", "500 кристаллов"],
      spotlight: "Главная награда сезона"
    },
    {
      id: "top_10",
      title: "Neon Predator",
      placement: "TOP 10",
      requirement: "Войти в десятку лучших игроков",
      rewards: ["Neon Crown Frame", "5 000 жемчуга", "250 кристаллов"],
      spotlight: "Элитный сезонный ранг"
    },
    {
      id: "top_100",
      title: "Abyss Contender",
      placement: "TOP 100",
      requirement: "Попасть в сезонную таблицу TOP 100",
      rewards: ["Abyss Badge", "1 500 жемчуга", "75 кристаллов"],
      spotlight: "Базовая награда рейтинга"
    },
    {
      id: "participant",
      title: "Season Entry",
      placement: "Участие",
      requirement: "Сыграть хотя бы один live-забег в сезоне",
      rewards: ["250 жемчуга", "Season 1 profile mark"],
      spotlight: "Награда за участие"
    }
  ],
  goals: [
    "Поднять live score через рост массы, LV и kills.",
    "Попробовать Dark Cave для сезонного бонуса.",
    "Обновлять лучший результат до конца недели.",
    "Удержаться в TOP 100 до окончания сезона."
  ]
};

export function rewardForRank(rank: number | null | undefined) {
  if (!rank || rank <= 0) return EVOFISH_SEASON_1.rewards.find((reward) => reward.id === "participant")!;
  if (rank === 1) return EVOFISH_SEASON_1.rewards.find((reward) => reward.id === "top_1")!;
  if (rank <= 10) return EVOFISH_SEASON_1.rewards.find((reward) => reward.id === "top_10")!;
  if (rank <= 100) return EVOFISH_SEASON_1.rewards.find((reward) => reward.id === "top_100")!;
  return EVOFISH_SEASON_1.rewards.find((reward) => reward.id === "participant")!;
}
