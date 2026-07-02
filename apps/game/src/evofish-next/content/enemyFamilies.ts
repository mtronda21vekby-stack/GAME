export type NextEnemyFamilyId = "reeflets" | "blue_school" | "stripe_pack" | "shadow_pod" | "abyss_jaw" | "apex_line";

export type NextEnemyFamily = {
  id: NextEnemyFamilyId;
  name: string;
  skinId: string;
  hpMultiplier: number;
  speedMultiplier: number;
  rewardMultiplier: number;
  description: string;
};

export const NEXT_ENEMY_FAMILIES: NextEnemyFamily[] = [
  {
    id: "reeflets",
    name: "Reeflets",
    skinId: "premium_fish",
    hpMultiplier: 0.92,
    speedMultiplier: 1.04,
    rewardMultiplier: 0.95,
    description: "Small reef fish. Fast, weak, and useful for early growth."
  },
  {
    id: "blue_school",
    name: "Blue School",
    skinId: "deep_sapphire",
    hpMultiplier: 1,
    speedMultiplier: 1,
    rewardMultiplier: 1,
    description: "Balanced schooling fish family."
  },
  {
    id: "stripe_pack",
    name: "Stripe Pack",
    skinId: "clown_pop",
    hpMultiplier: 1.1,
    speedMultiplier: 0.98,
    rewardMultiplier: 1.08,
    description: "Slightly tougher pack fish with stronger payout."
  },
  {
    id: "shadow_pod",
    name: "Shadow Pod",
    skinId: "neon_koi",
    hpMultiplier: 1.18,
    speedMultiplier: 1.08,
    rewardMultiplier: 1.16,
    description: "Aggressive fast pod found around tougher routes."
  },
  {
    id: "abyss_jaw",
    name: "Abyss Jaw",
    skinId: "shark_shadow",
    hpMultiplier: 1.34,
    speedMultiplier: 1.05,
    rewardMultiplier: 1.32,
    description: "Late-game predator family built to survive high-level players."
  },
  {
    id: "apex_line",
    name: "Apex Line",
    skinId: "mega_lava",
    hpMultiplier: 1.25,
    speedMultiplier: 1.04,
    rewardMultiplier: 1.35,
    description: "Rare elite bloodline used by apex predators."
  }
];

export function pickEnemyFamily(enemyId: number, archetypeId: string): NextEnemyFamily {
  if (archetypeId === "apex") return NEXT_ENEMY_FAMILIES[5];
  if (archetypeId === "leviathan") return NEXT_ENEMY_FAMILIES[5];
  if (archetypeId === "stalker") return NEXT_ENEMY_FAMILIES[4];
  if (archetypeId === "brute") return NEXT_ENEMY_FAMILIES[3];
  if (enemyId % 5 === 0) return NEXT_ENEMY_FAMILIES[3];
  if (enemyId % 4 === 0) return NEXT_ENEMY_FAMILIES[2];
  if (enemyId % 3 === 0) return NEXT_ENEMY_FAMILIES[1];
  return NEXT_ENEMY_FAMILIES[0];
}
