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
    description: "+HP за каждый уровень. Помогает проходить weekly hunt и APEX-зоны.",
    maxLevel: 6,
    coralCost: 2,
    stat: "hp",
    valuePerLevel: 0.075
  },
  {
    id: "sharp_teeth",
    name: "Острые зубы",
    description: "+DMG за каждый уровень. Связано с заданиями на охоту.",
    maxLevel: 6,
    coralCost: 2,
    stat: "damage",
    valuePerLevel: 0.068
  },
  {
    id: "jet_tail",
    name: "Реактивный хвост",
    description: "+SPD за каждый уровень. Ускоряет сбор жемчуга и кристаллов.",
    maxLevel: 6,
    coralCost: 2,
    stat: "speed",
    valuePerLevel: 0.052
  },
  {
    id: "pearl_instinct",
    name: "Инстинкт жемчуга",
    description: "+награды за kill/eat и +бонус к pickup жемчуга/кристаллов.",
    maxLevel: 6,
    coralCost: 3,
    stat: "reward",
    valuePerLevel: 0.055
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
