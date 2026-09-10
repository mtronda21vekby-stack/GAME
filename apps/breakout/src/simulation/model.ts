export type ItemId = "metal-strip" | "cloth-tape" | "service-shim";

export type InventorySlot = {
  itemId: ItemId;
  quantity: number;
};

export type PlayerStats = {
  health: number;
  stamina: number;
  suspicion: number;
  reputation: number;
  money: number;
  strength: number;
  intelligence: number;
};

export type ScheduleId =
  | "wake"
  | "roll-call"
  | "breakfast"
  | "work"
  | "free-time"
  | "dinner"
  | "lights-out";

export type ScheduleBlock = {
  id: ScheduleId;
  label: string;
  startMinute: number;
  endMinute: number;
  requiredZone?: "cell" | "roll-call" | "canteen" | "workshop";
};

export type EscapeObjectiveId =
  | "attend-roll-call"
  | "find-metal-strip"
  | "find-cloth-tape"
  | "craft-service-shim"
  | "reach-maintenance";

export type EscapeObjective = {
  id: EscapeObjectiveId;
  label: string;
  completed: boolean;
};

export type WorldFlags = {
  lockerSearched: boolean;
  workshopBinSearched: boolean;
  serviceHatchUnlocked: boolean;
  firstRouteComplete: boolean;
  rollCallAttendedToday: boolean;
};

export type GameSnapshot = {
  version: 1;
  day: number;
  minuteOfDay: number;
  stats: PlayerStats;
  inventory: InventorySlot[];
  objectives: EscapeObjective[];
  flags: WorldFlags;
  capturedCount: number;
};

export type PlayerZone = "cell" | "corridor" | "roll-call" | "canteen" | "workshop" | "maintenance";

export type SimulationContext = {
  playerZone: PlayerZone;
  guardCanSeePlayer: boolean;
};

export const ITEM_LABELS: Record<ItemId, string> = {
  "metal-strip": "Тонкая металлическая пластина",
  "cloth-tape": "Тканевая лента",
  "service-shim": "Самодельный сервисный ключ",
};
