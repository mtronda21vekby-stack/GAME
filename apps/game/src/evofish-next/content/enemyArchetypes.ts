export type NextEnemyArchetypeId = "prey" | "neutral" | "hunter" | "brute" | "stalker" | "leviathan" | "apex";

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
    baseSpeed: 134,
    aggroRadius: 340,
    attackRange: 54,
    courage: 1.1,
    damageMultiplier: 1.12,
    description: "Aggressive fish. Hunts weaker player and pressures space."
  },
  brute: {
    id: "brute",
    name: "Brute",
    baseSpeed: 94,
    aggroRadius: 410,
    attackRange: 72,
    courage: 1.35,
    damageMultiplier: 1.48,
    description: "Large predator. Slow but dangerous on contact."
  },
  stalker: {
    id: "stalker",
    name: "Stalker",
    baseSpeed: 148,
    aggroRadius: 520,
    attackRange: 74,
    courage: 1.6,
    damageMultiplier: 1.82,
    description: "Late-game hunter that does not flee easily and punishes careless movement."
  },
  leviathan: {
    id: "leviathan",
    name: "Leviathan",
    baseSpeed: 88,
    aggroRadius: 640,
    attackRange: 118,
    courage: 2.2,
    damageMultiplier: 2.65,
    description: "Huge late-game predator. Not meant to be devoured until the player is truly dominant."
  },
  apex: {
    id: "apex",
    name: "Apex",
    baseSpeed: 112,
    aggroRadius: 600,
    attackRange: 104,
    courage: 1.95,
    damageMultiplier: 2.35,
    description: "Rare apex predator. High HP, high rewards, and strong map pressure."
  }
};

export function chooseEnemyArchetype(id: number, threatLevel = 1): NextEnemyArchetype {
  if (threatLevel >= 35 && id % 13 === 0) return NEXT_ENEMY_ARCHETYPES.leviathan;
  if (threatLevel >= 24 && id % 11 === 0) return NEXT_ENEMY_ARCHETYPES.stalker;
  if (threatLevel >= 30 && id % 19 === 0) return NEXT_ENEMY_ARCHETYPES.apex;
  if (threatLevel >= 18 && id % 31 === 0) return NEXT_ENEMY_ARCHETYPES.apex;
  if (threatLevel >= 10 && id % 7 === 0) return NEXT_ENEMY_ARCHETYPES.brute;
  if (id % 5 === 0) return NEXT_ENEMY_ARCHETYPES.hunter;
  if (id % 3 === 0) return NEXT_ENEMY_ARCHETYPES.neutral;
  return NEXT_ENEMY_ARCHETYPES.prey;
}
