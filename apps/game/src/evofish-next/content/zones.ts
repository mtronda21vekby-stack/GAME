import type { EvoFishWorldId } from "./worldMaps";

export type NextZoneId =
  | "open_water"
  | "safe_spring"
  | "reef"
  | "pearl_bank"
  | "coral_garden"
  | "kelp_current"
  | "sunken_vault"
  | "storm_current"
  | "deep_trench"
  | "apex_waters"
  | "cave_entry"
  | "neon_forest"
  | "crystal_maze"
  | "echo_core"
  | "ancient_ruins"
  | "void_rift";

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
    id: "safe_spring",
    name: "Safe Spring",
    description: "Безопасный источник. Хорошее место для восстановления и обучения маршрутам.",
    x: 790,
    y: 655,
    radius: 520,
    risk: 0,
    rewardMultiplier: 0.92,
    healPerSecond: 4.2,
    color: "rgba(110,255,180,.16)"
  },
  {
    id: "reef",
    name: "Reef Garden",
    description: "Большой риф с мягким лечением и стабильной навигацией.",
    x: 1560,
    y: 1120,
    radius: 640,
    risk: 1,
    rewardMultiplier: 0.98,
    healPerSecond: 2.8,
    color: "rgba(90,255,170,.13)"
  },
  {
    id: "pearl_bank",
    name: "Pearl Bank",
    description: "Жемчужная банка: много ресурсов, низкое давление, средняя награда.",
    x: 1270,
    y: 2620,
    radius: 560,
    risk: 1,
    rewardMultiplier: 1.03,
    color: "rgba(255,243,160,.12)"
  },
  {
    id: "coral_garden",
    name: "Coral Garden",
    description: "Коралловый сад с редкими кристаллами и умеренными хищниками.",
    x: 2480,
    y: 2480,
    radius: 650,
    risk: 2,
    rewardMultiplier: 1.1,
    healPerSecond: 1.1,
    color: "rgba(255,140,190,.12)"
  },
  {
    id: "kelp_current",
    name: "Kelp Highway",
    description: "Быстрое течение для перемещения по большой карте.",
    x: 2710,
    y: 840,
    radius: 720,
    risk: 2,
    rewardMultiplier: 1.06,
    driftX: 78,
    driftY: 18,
    color: "rgba(120,240,255,.12)"
  },
  {
    id: "sunken_vault",
    name: "Sunken Vault",
    description: "Затонувшее хранилище: хорошие награды, но давление нарастает.",
    x: 3600,
    y: 1240,
    radius: 620,
    risk: 3,
    rewardMultiplier: 1.16,
    pressureDamagePerSecond: 1.4,
    color: "rgba(255,220,120,.12)"
  },
  {
    id: "storm_current",
    name: "Storm Current",
    description: "Опасное круговое течение. Быстро переносит игрока и врагов.",
    x: 4020,
    y: 2740,
    radius: 720,
    risk: 3,
    rewardMultiplier: 1.14,
    driftX: -62,
    driftY: -46,
    color: "rgba(120,180,255,.13)"
  },
  {
    id: "deep_trench",
    name: "Deep Trench",
    description: "Глубокая впадина. Давит медленно, но даёт лучшие награды.",
    x: 4740,
    y: 1760,
    radius: 670,
    risk: 4,
    rewardMultiplier: 1.22,
    pressureDamagePerSecond: 3.2,
    color: "rgba(180,140,255,.14)"
  },
  {
    id: "apex_waters",
    name: "Apex Waters",
    description: "Зона охоты элиты. Высокий риск, сильные выплаты.",
    x: 4540,
    y: 560,
    radius: 680,
    risk: 5,
    rewardMultiplier: 1.32,
    pressureDamagePerSecond: 2.1,
    color: "rgba(255,120,90,.14)"
  }
];

export const DARK_CAVE_ZONES: NextZoneDefinition[] = [
  {
    id: "cave_entry",
    name: "Cave Gate",
    description: "Спокойный вход в тёмную пещеру. Здесь безопасно осмотреться.",
    x: 720,
    y: 650,
    radius: 620,
    risk: 1,
    rewardMultiplier: 1,
    healPerSecond: 2.8,
    color: "rgba(120,240,255,.11)"
  },
  {
    id: "neon_forest",
    name: "Neon Forest",
    description: "Светящиеся водоросли дают ориентиры и ускоряют перемещение.",
    x: 1700,
    y: 2320,
    radius: 720,
    risk: 2,
    rewardMultiplier: 1.12,
    driftX: 48,
    driftY: -18,
    color: "rgba(80,255,210,.13)"
  },
  {
    id: "ancient_ruins",
    name: "Ancient Ruins",
    description: "Древние руины с мягким свечением и плотными ресурсами.",
    x: 2480,
    y: 980,
    radius: 650,
    risk: 3,
    rewardMultiplier: 1.18,
    color: "rgba(255,220,120,.12)"
  },
  {
    id: "crystal_maze",
    name: "Crystal Maze",
    description: "Кристаллический лабиринт давит на броню, но содержит лучшие награды.",
    x: 3760,
    y: 2360,
    radius: 760,
    risk: 4,
    rewardMultiplier: 1.26,
    pressureDamagePerSecond: 2.5,
    color: "rgba(190,140,255,.15)"
  },
  {
    id: "echo_core",
    name: "Echo Core",
    description: "Сюжетное сердце пещеры. Здесь слышно неоновое эхо древних рыб.",
    x: 4380,
    y: 840,
    radius: 670,
    risk: 5,
    rewardMultiplier: 1.36,
    pressureDamagePerSecond: 3.2,
    color: "rgba(255,220,120,.13)"
  },
  {
    id: "void_rift",
    name: "Void Rift",
    description: "Глубокий разлом. Самая жёсткая зона для поздней игры.",
    x: 4740,
    y: 3020,
    radius: 580,
    risk: 5,
    rewardMultiplier: 1.42,
    pressureDamagePerSecond: 3.8,
    color: "rgba(255,90,170,.12)"
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
