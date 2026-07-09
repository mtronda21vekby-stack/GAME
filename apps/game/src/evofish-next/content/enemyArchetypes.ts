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
    baseSpeed: 128,
    aggroRadius: 310,
    attackRange: 50,
    courage: 1.02,
    damageMultiplier: 1.02,
    description: "Aggressive fish. Hunts weaker player and pressures space."
  },
  brute: {
    id: "brute",
    name: "Brute",
    baseSpeed: 90,
    aggroRadius: 360,
    attackRange: 66,
    courage: 1.22,
    damageMultiplier: 1.32,
    description: "Large predator. Slow but dangerous on contact."
  },
  stalker: {
    id: "stalker",
    name: "Stalker",
    baseSpeed: 142,
    aggroRadius: 480,
    attackRange: 70,
    courage: 1.45,
    damageMultiplier: 1.62,
    description: "Late-game hunter that does not flee easily and punishes careless movement."
  },
  leviathan: {
    id: "leviathan",
    name: "Leviathan",
    baseSpeed: 86,
    aggroRadius: 610,
    attackRange: 112,
    courage: 2.05,
    damageMultiplier: 2.42,
    description: "Huge late-game predator. Not meant to be devoured until the player is truly dominant."
  },
  apex: {
    id: "apex",
    name: "Apex",
    baseSpeed: 106,
    aggroRadius: 560,
    attackRange: 98,
    courage: 1.78,
    damageMultiplier: 2.12,
    description: "Rare apex predator. High HP, high rewards, and strong map pressure."
  }
};

function midGameArchetype(id: number): NextEnemyArchetype {
  if (id % 23 === 0) return NEXT_ENEMY_ARCHETYPES.brute;
  if (id % 9 === 0) return NEXT_ENEMY_ARCHETYPES.hunter;
  if (id % 4 === 0) return NEXT_ENEMY_ARCHETYPES.neutral;
  return NEXT_ENEMY_ARCHETYPES.prey;
}

function postLevel21Archetype(id: number): NextEnemyArchetype {
  if (id % 29 === 0) return NEXT_ENEMY_ARCHETYPES.stalker;
  if (id % 13 === 0) return NEXT_ENEMY_ARCHETYPES.brute;
  if (id % 5 === 0) return NEXT_ENEMY_ARCHETYPES.hunter;
  if (id % 3 === 0) return NEXT_ENEMY_ARCHETYPES.neutral;
  return NEXT_ENEMY_ARCHETYPES.prey;
}

export function chooseEnemyArchetype(id: number, threatLevel = 1): NextEnemyArchetype {
  // Baseline population deliberately excludes apex/leviathan.
  // The balance-band system injects only 2-3 big fish per map, far from the player.
  if (threatLevel >= 34 && id % 13 === 0) return NEXT_ENEMY_ARCHETYPES.stalker;
  if (threatLevel >= 28 && id % 11 === 0) return NEXT_ENEMY_ARCHETYPES.brute;
  if (threatLevel >= 22 && threatLevel <= 37) return postLevel21Archetype(id);
  if (threatLevel >= 16 && threatLevel <= 31) return midGameArchetype(id);
  if (threatLevel >= 10 && id % 8 === 0) return NEXT_ENEMY_ARCHETYPES.brute;
  if (id % 6 === 0) return NEXT_ENEMY_ARCHETYPES.hunter;
  if (id % 3 === 0) return NEXT_ENEMY_ARCHETYPES.neutral;
  return NEXT_ENEMY_ARCHETYPES.prey;
}
