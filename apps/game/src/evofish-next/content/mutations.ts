export type NextMutationStat = "hp" | "damage" | "speed" | "reward";

export type NextMutationDefinition = {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  coralCost: number;
  stat: NextMutationStat;
  valuePerLevel: number;
};

export const NEXT_MUTATIONS: NextMutationDefinition[] = [
  {
    id: "thick_scales",
    name: "Толстая чешуя",
    description: "+HP за каждый уровень мутации.",
    maxLevel: 5,
    coralCost: 1,
    stat: "hp",
    valuePerLevel: 0.08
  },
  {
    id: "sharp_teeth",
    name: "Острые зубы",
    description: "+DMG за каждый уровень мутации.",
    maxLevel: 5,
    coralCost: 1,
    stat: "damage",
    valuePerLevel: 0.07
  },
  {
    id: "jet_tail",
    name: "Реактивный хвост",
    description: "+SPD за каждый уровень мутации.",
    maxLevel: 5,
    coralCost: 1,
    stat: "speed",
    valuePerLevel: 0.055
  },
  {
    id: "pearl_instinct",
    name: "Инстинкт жемчуга",
    description: "+награды за kill/eat.",
    maxLevel: 5,
    coralCost: 2,
    stat: "reward",
    valuePerLevel: 0.06
  }
];

export type NextMutationState = {
  levels: Record<string, number>;
};

export function defaultMutationState(): NextMutationState {
  return { levels: {} };
}

export function getMutationLevel(state: NextMutationState | undefined, id: string) {
  return Math.max(0, Math.floor(state?.levels?.[id] || 0));
}

export function getMutationBonus(state: NextMutationState | undefined, stat: NextMutationStat) {
  return NEXT_MUTATIONS
    .filter((mutation) => mutation.stat === stat)
    .reduce((sum, mutation) => sum + getMutationLevel(state, mutation.id) * mutation.valuePerLevel, 0);
}

export function getMutationTotalLevel(state: NextMutationState | undefined) {
  return NEXT_MUTATIONS.reduce((sum, mutation) => sum + getMutationLevel(state, mutation.id), 0);
}
