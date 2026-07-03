export type NextResourceKind = "pearls" | "coral" | "plankton" | "heal" | "boost" | "speed_perk" | "damage_perk" | "shield_perk" | "artifact_shell";

export type NextResourceNode = {
  id: number;
  kind: NextResourceKind;
  x: number;
  y: number;
  radius: number;
  value: number;
  respawnT: number;
  pulse: number;
};

export type NextResourceDefinition = {
  kind: NextResourceKind;
  name: string;
  color: string;
  glow: string;
  radius: number;
  valueMin: number;
  valueMax: number;
  weight: number;
  respawnMin: number;
  respawnMax: number;
};

export const NEXT_RESOURCE_DEFS: NextResourceDefinition[] = [
  {
    kind: "pearls",
    name: "Жемчужина",
    color: "#fff3a0",
    glow: "rgba(255,220,120,.34)",
    radius: 16,
    valueMin: 9,
    valueMax: 19,
    weight: 46,
    respawnMin: 15,
    respawnMax: 28
  },
  {
    kind: "plankton",
    name: "XP Планктон",
    color: "#78f0ff",
    glow: "rgba(120,240,255,.28)",
    radius: 15,
    valueMin: 16,
    valueMax: 34,
    weight: 29,
    respawnMin: 12,
    respawnMax: 23
  },
  {
    kind: "heal",
    name: "Healing Bubble",
    color: "#6effb4",
    glow: "rgba(110,255,180,.28)",
    radius: 17,
    valueMin: 14,
    valueMax: 30,
    weight: 18,
    respawnMin: 20,
    respawnMax: 36
  },
  {
    kind: "coral",
    name: "Кристалл коралла",
    color: "#8fe8ff",
    glow: "rgba(190,140,255,.34)",
    radius: 18,
    valueMin: 1,
    valueMax: 1,
    weight: 3,
    respawnMin: 72,
    respawnMax: 118
  },
  {
    kind: "boost",
    name: "Current Spark",
    color: "#b48cff",
    glow: "rgba(180,140,255,.28)",
    radius: 15,
    valueMin: 1,
    valueMax: 1,
    weight: 7,
    respawnMin: 28,
    respawnMax: 46
  },
  {
    kind: "speed_perk",
    name: "SPD Перк",
    color: "#5bf0ff",
    glow: "rgba(91,240,255,.30)",
    radius: 16,
    valueMin: 6,
    valueMax: 10,
    weight: 7,
    respawnMin: 38,
    respawnMax: 64
  },
  {
    kind: "damage_perk",
    name: "DMG Перк",
    color: "#ffd36d",
    glow: "rgba(255,180,90,.30)",
    radius: 16,
    valueMin: 6,
    valueMax: 10,
    weight: 6,
    respawnMin: 42,
    respawnMax: 70
  },
  {
    kind: "shield_perk",
    name: "SHD Перк",
    color: "#9affc1",
    glow: "rgba(110,255,180,.30)",
    radius: 16,
    valueMin: 6,
    valueMax: 9,
    weight: 6,
    respawnMin: 46,
    respawnMax: 76
  },
  {
    kind: "artifact_shell",
    name: "Древняя раковина",
    color: "#ffcc6d",
    glow: "rgba(255,204,109,.34)",
    radius: 20,
    valueMin: 1,
    valueMax: 1,
    weight: 1,
    respawnMin: 150,
    respawnMax: 230
  }
];

export function resourceDef(kind: NextResourceKind) {
  return NEXT_RESOURCE_DEFS.find((item) => item.kind === kind) || NEXT_RESOURCE_DEFS[0];
}

function weightedResourceKind(): NextResourceKind {
  const total = NEXT_RESOURCE_DEFS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const def of NEXT_RESOURCE_DEFS) {
    roll -= def.weight;
    if (roll <= 0) return def.kind;
  }

  return "pearls";
}

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function makeResourceNode(id: number, worldWidth: number, worldHeight: number, forcedKind?: NextResourceKind): NextResourceNode {
  const kind = forcedKind || weightedResourceKind();
  const def = resourceDef(kind);
  return {
    id,
    kind,
    x: 120 + Math.random() * (worldWidth - 240),
    y: 120 + Math.random() * (worldHeight - 240),
    radius: def.radius,
    value: randomInt(def.valueMin, def.valueMax),
    respawnT: 0,
    pulse: Math.random() * Math.PI * 2
  };
}

export function createResourceField(count: number, worldWidth: number, worldHeight: number) {
  const forced: NextResourceKind[] = ["pearls", "plankton", "heal", "boost", "speed_perk", "damage_perk", "shield_perk"];
  return Array.from({ length: count }, (_, index) => makeResourceNode(index + 1, worldWidth, worldHeight, forced[index]));
}

export function resourceRespawnDelay(kind: NextResourceKind) {
  const def = resourceDef(kind);
  return def.respawnMin + Math.random() * (def.respawnMax - def.respawnMin);
}
