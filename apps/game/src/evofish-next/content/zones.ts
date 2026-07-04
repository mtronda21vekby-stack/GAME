import type { EvoFishWorldId } from "./worldMaps";

export type NextZoneId = "open_water" | "reef" | "kelp_current" | "deep_trench" | "apex_waters" | "cave_entry" | "neon_forest" | "crystal_maze" | "echo_core";

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

export const DARK_CAVE_OPEN_ZONE: NextZoneDefinition = {
  id: "open_water",
  name: "Dark Cave",
  description: "Тёмная вода с мягким неоновым свечением.",
  x: 0,
  y: 0,
  radius: 0,
  risk: 1,
  rewardMultiplier: 1.05,
  color: "rgba(190,140,255,.08)"
};

export const NEXT_MAP_ZONES: NextZoneDefinition[] = [
  {
    id: "reef",
    name: "Reef Garden",
    description: "Safe reef. Slowly restores HP and gives stable routing.",
    x: 676,
    y: 546,
    radius: 468,
    risk: 1,
    rewardMultiplier: 0.95,
    healPerSecond: 3.2,
    color: "rgba(110,255,180,.14)"
  },
  {
    id: "kelp_current",
    name: "Kelp Current",
    description: "Moving current. Pushes the player and speeds map traversal.",
    x: 1664,
    y: 1768,
    radius: 533,
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
    x: 2938,
    y: 1846,
    radius: 546,
    risk: 4,
    rewardMultiplier: 1.18,
    pressureDamagePerSecond: 4.2,
    color: "rgba(180,140,255,.13)"
  },
  {
    id: "apex_waters",
    name: "Apex Waters",
    description: "High-risk hunting area. More pressure, better payouts.",
    x: 2886,
    y: 650,
    radius: 572,
    risk: 5,
    rewardMultiplier: 1.28,
    pressureDamagePerSecond: 2.4,
    color: "rgba(255,120,90,.13)"
  }
];

export const DARK_CAVE_ZONES: NextZoneDefinition[] = [
  {
    id: "cave_entry",
    name: "Cave Gate",
    description: "Спокойный вход в тёмную пещеру. Здесь безопасно осмотреться.",
    x: 510,
    y: 520,
    radius: 520,
    risk: 1,
    rewardMultiplier: 1,
    healPerSecond: 2.4,
    color: "rgba(120,240,255,.10)"
  },
  {
    id: "neon_forest",
    name: "Neon Forest",
    description: "Светящиеся водоросли дают ориентиры и ускоряют перемещение.",
    x: 1500,
    y: 1660,
    radius: 560,
    risk: 2,
    rewardMultiplier: 1.12,
    driftX: 42,
    driftY: -12,
    color: "rgba(80,255,210,.12)"
  },
  {
    id: "crystal_maze",
    name: "Crystal Maze",
    description: "Кристаллический лабиринт давит на броню, но содержит лучшие награды.",
    x: 2860,
    y: 1550,
    radius: 620,
    risk: 4,
    rewardMultiplier: 1.24,
    pressureDamagePerSecond: 2.8,
    color: "rgba(190,140,255,.14)"
  },
  {
    id: "echo_core",
    name: "Echo Core",
    description: "Сюжетное сердце пещеры. Здесь слышно неоновое эхо древних рыб.",
    x: 2880,
    y: 610,
    radius: 540,
    risk: 5,
    rewardMultiplier: 1.34,
    pressureDamagePerSecond: 3.6,
    color: "rgba(255,220,120,.12)"
  }
];

export function getZonesForWorld(worldId: EvoFishWorldId = "main_reef") {
  return worldId === "dark_cave" ? DARK_CAVE_ZONES : NEXT_MAP_ZONES;
}

export function getZoneAt(x: number, y: number, worldId: EvoFishWorldId = "main_reef"): NextZoneDefinition {
  for (const zone of getZonesForWorld(worldId)) {
    const dx = x - zone.x;
    const dy = y - zone.y;
    if (Math.hypot(dx, dy) <= zone.radius) return zone;
  }

  return worldId === "dark_cave" ? DARK_CAVE_OPEN_ZONE : OPEN_WATER_ZONE;
}
