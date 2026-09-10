import type { NpcDefinition, ScheduleDefinition, WorldInteraction, ZoneId } from "../domain";

export type Rect = { x: number; z: number; w: number; d: number };
export type RoomDefinition = Rect & {
  id: ZoneId;
  label: string;
  floor: number;
  restricted?: boolean;
};
export type WallDefinition = Rect & { h?: number };
export type DoorDefinition = Rect & {
  id: string;
  label: string;
  requirement: "none" | "service" | "roof";
};

export const WORLD_BOUNDS: Rect = { x: 0, z: 0, w: 34, d: 26 };

export const ROOMS: RoomDefinition[] = [
  { id: "cellblock", label: "Блок C", x: -10.6, z: 5.2, w: 10.6, d: 8.6, floor: 0x363c3e },
  { id: "canteen", label: "Столовая", x: 8.9, z: 6.4, w: 10.8, d: 6.8, floor: 0x5a5548 },
  { id: "laundry", label: "Прачечная", x: 9.7, z: -3.5, w: 8.5, d: 7.2, floor: 0x4f5858 },
  { id: "gym", label: "Спортзал", x: -8.8, z: -5.7, w: 8.7, d: 5.6, floor: 0x554b45 },
  { id: "medical", label: "Медблок", x: -1.2, z: -8.7, w: 6.5, d: 4.2, floor: 0x475654 },
  { id: "yard", label: "Двор", x: 0, z: 3.2, w: 9.4, d: 8.4, floor: 0x3e5145 },
  { id: "maintenance", label: "Техзона", x: 12.5, z: -9.2, w: 5.5, d: 4.8, floor: 0x394045, restricted: true },
  { id: "roof", label: "Крыша", x: 15.25, z: 6.9, w: 2.25, d: 5.6, floor: 0x33383a, restricted: true },
  { id: "tunnel", label: "Старый тоннель", x: -14.2, z: 10.5, w: 3.6, d: 3.1, floor: 0x332e29, restricted: true },
];

// Wall segments deliberately leave door-sized gaps. Closed door colliders are handled separately.
export const WALLS: WallDefinition[] = [
  { x: 0, z: -12.7, w: 33.4, d: 0.45, h: 2.4 },
  { x: 0, z: 12.7, w: 33.4, d: 0.45, h: 2.4 },
  { x: -16.7, z: 0, w: 0.45, d: 25.8, h: 2.4 },
  { x: 16.7, z: -4.0, w: 0.45, d: 17.1, h: 2.4 },
  { x: 16.7, z: 11.0, w: 0.45, d: 3.6, h: 2.4 },
  { x: -10.6, z: 9.55, w: 10.8, d: 0.28 },
  { x: -15.9, z: 5.2, w: 0.28, d: 8.8 },
  { x: -10.5, z: 0.9, w: 5.7, d: 0.28 },
  { x: -5.4, z: 0.9, w: 2.6, d: 0.28 },
  { x: -5.2, z: 3.8, w: 0.28, d: 5.8 },
  { x: -5.2, z: 8.85, w: 0.28, d: 1.4 },
  { x: 8.9, z: 9.8, w: 11.0, d: 0.28 },
  { x: 14.4, z: 5.2, w: 0.28, d: 4.5 },
  { x: 14.4, z: 9.45, w: 0.28, d: 0.8 },
  { x: 8.1, z: 3.0, w: 4.6, d: 0.28 },
  { x: 13.45, z: 3.0, w: 1.7, d: 0.28 },
  { x: 9.7, z: -7.1, w: 8.7, d: 0.28 },
  { x: 5.4, z: -3.5, w: 0.28, d: 7.4 },
  { x: 13.9, z: -3.5, w: 0.28, d: 7.4 },
  { x: 8.7, z: 0.1, w: 3.6, d: 0.28 },
  { x: 13.2, z: 0.1, w: 1.4, d: 0.28 },
  { x: -8.8, z: -8.5, w: 8.9, d: 0.28 },
  { x: -13.2, z: -5.7, w: 0.28, d: 5.8 },
  { x: -4.4, z: -5.7, w: 0.28, d: 5.8 },
  { x: -10.3, z: -2.9, w: 5.8, d: 0.28 },
  { x: -5.1, z: -2.9, w: 1.4, d: 0.28 },
  { x: -1.2, z: -10.8, w: 6.7, d: 0.28 },
  { x: -4.45, z: -8.7, w: 0.28, d: 4.4 },
  { x: 2.05, z: -8.7, w: 0.28, d: 4.4 },
  { x: -2.25, z: -6.6, w: 4.1, d: 0.28 },
  { x: 1.6, z: -6.6, w: 0.9, d: 0.28 },
  { x: 12.5, z: -11.6, w: 5.7, d: 0.28 },
  { x: 9.75, z: -9.2, w: 0.28, d: 4.9 },
  { x: 15.25, z: -9.2, w: 0.28, d: 4.9 },
  { x: 11.525, z: -6.8, w: 3.55, d: 0.28 },
  { x: 14.975, z: -6.8, w: 0.55, d: 0.28 },
  { x: 0, z: -1.0, w: 9.5, d: 0.18, h: 1.1 },
];

export const DOORS: DoorDefinition[] = [
  { id: "cell-door", label: "Дверь блока C", x: -5.2, z: 7.55, w: 0.35, d: 1.1, requirement: "none" },
  { id: "canteen-door", label: "Столовая", x: 11.9, z: 3.0, w: 1.2, d: 0.35, requirement: "none" },
  { id: "laundry-door", label: "Прачечная", x: 12.0, z: 0.1, w: 1.2, d: 0.35, requirement: "none" },
  { id: "gym-door", label: "Спортзал", x: -6.6, z: -2.9, w: 1.2, d: 0.35, requirement: "none" },
  { id: "medical-door", label: "Медблок", x: 0.55, z: -6.6, w: 1.2, d: 0.35, requirement: "none" },
  { id: "service-door", label: "Служебная дверь", x: 14.0, z: -6.8, w: 1.2, d: 0.35, requirement: "service" },
  { id: "roof-gate", label: "Сетка на крышу", x: 14.4, z: 8.45, w: 0.35, d: 1.2, requirement: "roof" },
];

export const INTERACTIONS: WorldInteraction[] = [
  { id: "cell-desk", kind: "container", label: "Тумбочка", x: -13.2, z: 6.9 },
  { id: "cell-linen", kind: "container", label: "Шкаф с бельём", x: -12.8, z: 2.7 },
  { id: "canteen-bin", kind: "container", label: "Тележка столовой", x: 8.7, z: 7.8 },
  { id: "laundry-cart", kind: "container", label: "Служебная тележка", x: 7.1, z: -5.0 },
  { id: "gym-locker", kind: "container", label: "Шкафчик спортзала", x: -11.3, z: -6.8 },
  { id: "medical-linen", kind: "container", label: "Бельевой шкаф", x: -2.6, z: -9.0 },
  { id: "bookshelf", kind: "activity", label: "Учебные материалы", x: -7.1, z: 3.1 },
  { id: "bench", kind: "activity", label: "Силовая скамья", x: -8.7, z: -5.5 },
  { id: "laundry-job", kind: "activity", label: "Рабочая станция", x: 10.0, z: -4.4 },
  { id: "bed", kind: "activity", label: "Кровать", x: -13.7, z: 8.0 },
  { id: "stash", kind: "activity", label: "Тайник в стене", x: -15.0, z: 5.6 },
  { id: "tunnel-dig", kind: "activity", label: "Слабый участок пола", x: -14.5, z: 8.8 },
  { id: "maintenance-hatch", kind: "escape", label: "Технический люк", x: 13.2, z: -10.5 },
  { id: "roof-exit", kind: "escape", label: "Наружная лестница", x: 15.55, z: 6.0 },
  { id: "tunnel-exit", kind: "escape", label: "Старый дренаж", x: -14.5, z: 8.65 },
  ...DOORS.map((door) => ({ id: door.id, kind: "door" as const, label: door.label, x: door.x, z: door.z })),
];

export const SCHEDULES: ScheduleDefinition[] = [
  { id: "lightsout", label: "Отбой", start: 0, end: 390, requiredZone: "cellblock" },
  { id: "rollcall", label: "Перекличка", start: 390, end: 450, requiredZone: "cellblock" },
  { id: "breakfast", label: "Завтрак", start: 450, end: 540, requiredZone: "canteen" },
  { id: "work", label: "Рабочая смена", start: 540, end: 720, requiredZone: "laundry" },
  { id: "free", label: "Свободное время", start: 720, end: 780, requiredZone: null },
  { id: "breakfast", label: "Обед", start: 780, end: 840, requiredZone: "canteen" },
  { id: "work", label: "Рабочая смена", start: 840, end: 1020, requiredZone: "laundry" },
  { id: "yard", label: "Прогулка", start: 1020, end: 1140, requiredZone: "yard" },
  { id: "dinner", label: "Ужин", start: 1140, end: 1260, requiredZone: "canteen" },
  { id: "free", label: "Свободное время", start: 1260, end: 1320, requiredZone: null },
  { id: "rollcall", label: "Вечерняя перекличка", start: 1320, end: 1380, requiredZone: "cellblock" },
  { id: "lightsout", label: "Отбой", start: 1380, end: 1440, requiredZone: "cellblock" },
];

export const NPCS: NpcDefinition[] = [
  { id: "marco", name: "Marco", role: "prisoner", color: 0xcf8f50, description: "Знает старые коммуникации блока C. Не помогает бесплатно." },
  { id: "rook", name: "Rook", role: "prisoner", color: 0xa85c4b, description: "Торгует тем, чего официально здесь не существует." },
  { id: "nico", name: "Nico", role: "prisoner", color: 0x92765f, description: "Работает в прачечной и слышит разговоры охраны." },
  { id: "hayes", name: "Dr. Hayes", role: "doctor", color: 0x5e8b83, description: "Врач. Лечит травмы и слишком много замечает." },
  { id: "miller", name: "Miller", role: "guard", color: 0x4e6887, description: "Старший смены. Деньги понимает быстрее намёков." },
  { id: "cole", name: "Warden Cole", role: "warden", color: 0x273746, description: "Начальник комплекса. Встречи с ним обычно ничем хорошим не заканчиваются." },
  { id: "guard-a", name: "Officer Lane", role: "guard", color: 0x465f7a, description: "Патруль блока." },
  { id: "guard-b", name: "Officer Shaw", role: "guard", color: 0x465f7a, description: "Патруль внутреннего двора." },
  { id: "guard-c", name: "Officer Reed", role: "guard", color: 0x465f7a, description: "Проверяет служебные помещения." },
  { id: "prisoner-a", name: "Isaac", role: "prisoner", color: 0x876e5d, description: "Заключённый блока C." },
  { id: "prisoner-b", name: "Felix", role: "prisoner", color: 0x816553, description: "Заключённый блока C." },
  { id: "prisoner-c", name: "Sam", role: "prisoner", color: 0x9e7455, description: "Заключённый блока C." },
];

export const ZONE_CENTERS: Record<ZoneId, { x: number; z: number }> = {
  cellblock: { x: -10.3, z: 5.2 },
  canteen: { x: 9.4, z: 6.3 },
  laundry: { x: 9.7, z: -3.7 },
  yard: { x: 0, z: 3.2 },
  gym: { x: -8.7, z: -5.6 },
  medical: { x: -1.0, z: -8.7 },
  maintenance: { x: 12.7, z: -9.3 },
  roof: { x: 15.25, z: 6.9 },
  tunnel: { x: -14.5, z: 10.6 },
  corridor: { x: 0, z: -2.0 },
};

export function scheduleAt(minute: number) {
  const normalized = ((minute % 1440) + 1440) % 1440;
  return SCHEDULES.find((entry) => normalized >= entry.start && normalized < entry.end) ?? SCHEDULES[0];
}

export function zoneAt(x: number, z: number): ZoneId {
  for (const room of ROOMS) {
    if (Math.abs(x - room.x) <= room.w / 2 && Math.abs(z - room.z) <= room.d / 2) return room.id;
  }
  return "corridor";
}
