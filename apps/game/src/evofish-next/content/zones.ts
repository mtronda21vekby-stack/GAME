export type NextZoneId = "open_water" | "reef" | "kelp_current" | "deep_trench" | "apex_waters";

export type NextZoneDefinition = {
  id: NextZoneId;
  name: string;
  description: string;
  x: number;
  y: number;
  radius: number;
  risk: number;
  rewardMultiplier: number;
  healPerSecond?: number;
  pressureDamagePerSecond?: number;
  driftX?: number;
  driftY?: number;
  color: string;
};

export const OPEN_WATER_ZONE: NextZoneDefinition = {
  id: "open_water",
  name: "Open Water",
  description: "Neutral water. No bonus and no pressure.",
  x: 0,
  y: 0,
  radius: 0,
  risk: 0,
  rewardMultiplier: 1,
  color: "rgba(120,240,255,.08)"
};

export const NEXT_MAP_ZONES: NextZoneDefinition[] = [
  {
    id: "reef",
    name: "Reef Garden",
    description: "Safe reef. Slowly restores HP and gives stable routing.",
    x: 520,
    y: 420,
    radius: 360,
    risk: 1,
    rewardMultiplier: 0.95,
    healPerSecond: 3.2,
    color: "rgba(110,255,180,.14)"
  },
  {
    id: "kelp_current",
    name: "Kelp Current",
    description: "Moving current. Pushes the player and speeds map traversal.",
    x: 1280,
    y: 1360,
    radius: 410,
    risk: 2,
    rewardMultiplier: 1.05,
    driftX: 68,
    driftY: -18,
    color: "rgba(120,240,255,.12)"
  },
  {
    id: "deep_trench",
    name: "Deep Trench",
    description: "Pressure zone. Hurts slowly, but gives better rewards.",
    x: 2260,
    y: 1420,
    radius: 420,
    risk: 4,
    rewardMultiplier: 1.18,
    pressureDamagePerSecond: 4.2,
    color: "rgba(180,140,255,.13)"
  },
  {
    id: "apex_waters",
    name: "Apex Waters",
    description: "High-risk hunting area. More pressure, better payouts.",
    x: 2220,
    y: 500,
    radius: 440,
    risk: 5,
    rewardMultiplier: 1.28,
    pressureDamagePerSecond: 2.4,
    color: "rgba(255,120,90,.13)"
  }
];

export function getZoneAt(x: number, y: number): NextZoneDefinition {
  for (const zone of NEXT_MAP_ZONES) {
    const dx = x - zone.x;
    const dy = y - zone.y;
    if (Math.hypot(dx, dy) <= zone.radius) return zone;
  }

  return OPEN_WATER_ZONE;
}
