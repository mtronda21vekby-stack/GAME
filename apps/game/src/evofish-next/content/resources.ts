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
    weight: 0,
    respawnMin: 999999,
    respawnMax: 999999
  }
];

export function resourceDef(kind: NextResourceKind) {
  return NEXT_RESOURCE_DEFS.find((item) => item.kind === kind) || NEXT_RESOURCE_DEFS[0];
}

function weightedResourceKind(): NextResourceKind {
  const spawnable = NEXT_RESOURCE_DEFS.filter((item) => item.kind !== "artifact_shell" && item.weight > 0);
  const total = spawnable.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const def of spawnable) {
    roll -= def.weight;
    if (roll <= 0) return def.kind;
  }

  return "pearls";
}

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function hiddenArtifactPoint(slot: number, worldWidth: number, worldHeight: number) {
  const points = [
    { x: worldWidth * 0.13, y: worldHeight * 0.83 },
    { x: worldWidth * 0.58, y: worldHeight * 0.13 },
    { x: worldWidth * 0.88, y: worldHeight * 0.58 }
  ];
  const point = points[slot % points.length];
  return {
    x: Math.round(point.x + (Math.random() - 0.5) * 110),
    y: Math.round(point.y + (Math.random() - 0.5) * 100)
  };
}

export function makeResourceNode(id: number, worldWidth: number, worldHeight: number, forcedKind?: NextResourceKind): NextResourceNode {
  const kind = forcedKind || weightedResourceKind();
  const def = resourceDef(kind);
  const hiddenArtifact = kind === "artifact_shell";
  const hiddenPoint = hiddenArtifact ? hiddenArtifactPoint((id - 1) % 3, worldWidth, worldHeight) : null;
  return {
    id,
    kind,
    x: hiddenPoint?.x || 120 + Math.random() * (worldWidth - 240),
    y: hiddenPoint?.y || 120 + Math.random() * (worldHeight - 240),
    radius: def.radius,
    value: randomInt(def.valueMin, def.valueMax),
    respawnT: 0,
    pulse: Math.random() * Math.PI * 2
  };
}

function forcedResourceKind(index: number, count: number): NextResourceKind | undefined {
  const opening: NextResourceKind[] = ["pearls", "plankton", "heal", "boost", "speed_perk", "damage_perk", "shield_perk"];
  if (index < opening.length) return opening[index];
  if (index >= Math.max(0, count - 3)) return "artifact_shell";
  return undefined;
}

export function createResourceField(count: number, worldWidth: number, worldHeight: number) {
  return Array.from({ length: count }, (_, index) => makeResourceNode(index + 1, worldWidth, worldHeight, forcedResourceKind(index, count)));
}

export function resourceRespawnDelay(kind: NextResourceKind) {
  if (kind === "artifact_shell") return Number.POSITIVE_INFINITY;
  const def = resourceDef(kind);
  return def.respawnMin + Math.random() * (def.respawnMax - def.respawnMin);
}
