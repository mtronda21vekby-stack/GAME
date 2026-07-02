export type NextMapEventKind = "resource_bloom" | "hunt_pack" | "safe_spring";

export type NextMapEventState = {
  id: number;
  kind: NextMapEventKind;
  name: string;
  description: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  progress: number;
  target: number;
  rewardXp: number;
  rewardPearls: number;
  rewardCorals: number;
  tick: number;
  lastKills: number;
  lastResources: number;
};

const EVENT_ORDER: NextMapEventKind[] = ["resource_bloom", "safe_spring", "hunt_pack"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function eventPoint(worldWidth: number, worldHeight: number) {
  const pad = 360;
  return {
    x: pad + Math.random() * Math.max(1, worldWidth - pad * 2),
    y: pad + Math.random() * Math.max(1, worldHeight - pad * 2)
  };
}

export function makeNextMapEvent(id: number, worldWidth: number, worldHeight: number, level = 1): NextMapEventState {
  const kind = EVENT_ORDER[id % EVENT_ORDER.length];
  const point = eventPoint(worldWidth, worldHeight);
  const rewardScale = 1 + Math.min(2.4, Math.max(0, level - 1) * 0.045);

  if (kind === "hunt_pack") {
    return {
      id,
      kind,
      name: "Pack Hunt",
      description: "Enter the event area and defeat roaming fish before time runs out.",
      x: point.x,
      y: point.y,
      radius: 380,
      ttl: 72,
      progress: 0,
      target: 4,
      rewardXp: Math.round(120 * rewardScale),
      rewardPearls: Math.round(42 * rewardScale),
      rewardCorals: level >= 10 ? 1 : 0,
      tick: 0,
      lastKills: 0,
      lastResources: 0
    };
  }

  if (kind === "safe_spring") {
    return {
      id,
      kind,
      name: "Safe Spring",
      description: "Hold inside the spring to restore HP and complete the objective.",
      x: point.x,
      y: point.y,
      radius: 330,
      ttl: 64,
      progress: 0,
      target: 12,
      rewardXp: Math.round(86 * rewardScale),
      rewardPearls: Math.round(30 * rewardScale),
      rewardCorals: 0,
      tick: 0,
      lastKills: 0,
      lastResources: 0
    };
  }

  return {
    id,
    kind,
    name: "Resource Bloom",
    description: "Collect resources in the bloom field for bonus XP and currency.",
    x: point.x,
    y: point.y,
    radius: 360,
    ttl: 70,
    progress: 0,
    target: clamp(3 + Math.floor(level / 18), 3, 6),
    rewardXp: Math.round(94 * rewardScale),
    rewardPearls: Math.round(38 * rewardScale),
    rewardCorals: level >= 15 ? 1 : 0,
    tick: 0,
    lastKills: 0,
    lastResources: 0
  };
}

export function eventColor(kind: NextMapEventKind) {
  if (kind === "hunt_pack") return "rgba(255,120,90,.32)";
  if (kind === "safe_spring") return "rgba(110,255,180,.28)";
  return "rgba(255,220,120,.30)";
}
