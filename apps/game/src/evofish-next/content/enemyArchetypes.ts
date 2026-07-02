export type NextEnemyArchetypeId = "prey" | "neutral" | "hunter" | "brute" | "apex";

export type NextEnemyArchetype = {
  id: NextEnemyArchetypeId;
  name: string;
  baseSpeed: number;
  aggroRadius: number;
  attackRange: number;
  courage: number;
  damageMultiplier: number;
  description: string;
};

export const NEXT_ENEMY_ARCHETYPES: Record<NextEnemyArchetypeId, NextEnemyArchetype> = {
  prey: {
    id: "prey",
    name: "Prey",
    baseSpeed: 118,
    aggroRadius: 170,
    attackRange: 34,
    courage: 0.45,
    damageMultiplier: 0.55,
    description: "Weak fish. Mostly flees from stronger player."
  },
  neutral: {
    id: "neutral",
    name: "Neutral",
    baseSpeed: 96,
    aggroRadius: 210,
    attackRange: 38,
    courage: 0.78,
    damageMultiplier: 0.75,
    description: "Default roaming fish. Can retaliate if close."
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    baseSpeed: 132,
    aggroRadius: 330,
    attackRange: 52,
    courage: 1.1,
    damageMultiplier: 1.1,
    description: "Aggressive fish. Hunts weaker player and pressures space."
  },
  brute: {
    id: "brute",
    name: "Brute",
    baseSpeed: 92,
    aggroRadius: 390,
    attackRange: 68,
    courage: 1.35,
    damageMultiplier: 1.45,
    description: "Large predator. Slow but dangerous on contact."
  },
  apex: {
    id: "apex",
    name: "Apex",
    baseSpeed: 108,
    aggroRadius: 560,
    attackRange: 96,
    courage: 1.85,
    damageMultiplier: 2.2,
    description: "Rare apex predator. High HP, high rewards, and strong map pressure."
  }
};

export function chooseEnemyArchetype(id: number): NextEnemyArchetype {
  if (id % 31 === 0) return NEXT_ENEMY_ARCHETYPES.apex;
  if (id % 7 === 0) return NEXT_ENEMY_ARCHETYPES.brute;
  if (id % 5 === 0) return NEXT_ENEMY_ARCHETYPES.hunter;
  if (id % 3 === 0) return NEXT_ENEMY_ARCHETYPES.neutral;
  return NEXT_ENEMY_ARCHETYPES.prey;
}
