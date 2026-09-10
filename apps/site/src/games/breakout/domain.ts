export type ZoneId =
  | "cellblock"
  | "canteen"
  | "laundry"
  | "yard"
  | "gym"
  | "medical"
  | "maintenance"
  | "roof"
  | "tunnel"
  | "corridor";

export type ScheduleId = "rollcall" | "breakfast" | "work" | "free" | "yard" | "dinner" | "lightsout";
export type NpcRole = "prisoner" | "guard" | "doctor" | "warden";
export type EscapeRouteId = "maintenance" | "roof" | "tunnel";

export type ItemId =
  | "toothbrush"
  | "lighter"
  | "file"
  | "ductTape"
  | "sheet"
  | "spoon"
  | "screwdriver"
  | "plasticKey"
  | "cutters"
  | "rope"
  | "guardUniform"
  | "keycard";

export type ItemDefinition = {
  id: ItemId;
  name: string;
  icon: string;
  contraband: boolean;
  price: number;
  description: string;
};

export type Inventory = Record<ItemId, number>;

export type EscapeProgress = Record<EscapeRouteId, {
  discovered: boolean;
  complete: boolean;
  progress: number;
}>;

export type RelationshipState = Record<string, number>;

export type GameSnapshot = {
  version: 1;
  day: number;
  minute: number;
  schedule: ScheduleId;
  health: number;
  stamina: number;
  suspicion: number;
  reputation: number;
  money: number;
  strength: number;
  intelligence: number;
  inventory: Inventory;
  stash: Inventory;
  relationships: RelationshipState;
  searched: string[];
  openedDoors: string[];
  workProgress: number;
  tunnelDigs: number;
  currentZone: ZoneId;
  playerPosition: { x: number; z: number };
  focusNpcId: string | null;
  message: string;
  routeProgress: EscapeProgress;
  completedRoute: EscapeRouteId | null;
  teleportRevision: number;
  paused: boolean;
};

export type ScheduleDefinition = {
  id: ScheduleId;
  label: string;
  start: number;
  end: number;
  requiredZone: ZoneId | null;
};

export type NpcDefinition = {
  id: string;
  name: string;
  role: NpcRole;
  color: number;
  description: string;
};

export type InteractionKind = "container" | "door" | "activity" | "npc" | "escape";

export type WorldInteraction = {
  id: string;
  kind: InteractionKind;
  label: string;
  x: number;
  z: number;
  radius?: number;
};
