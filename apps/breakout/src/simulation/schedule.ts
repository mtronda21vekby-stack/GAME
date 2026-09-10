import type { ScheduleBlock, ScheduleId } from "./model";

export const DAY_MINUTES = 24 * 60;

export const SCHEDULE: readonly ScheduleBlock[] = [
  { id: "wake", label: "Подъём", startMinute: 7 * 60, endMinute: 7 * 60 + 30, requiredZone: "cell" },
  { id: "roll-call", label: "Перекличка", startMinute: 7 * 60 + 30, endMinute: 8 * 60, requiredZone: "roll-call" },
  { id: "breakfast", label: "Завтрак", startMinute: 8 * 60, endMinute: 9 * 60, requiredZone: "canteen" },
  { id: "work", label: "Рабочая смена", startMinute: 9 * 60, endMinute: 12 * 60, requiredZone: "workshop" },
  { id: "free-time", label: "Свободное время", startMinute: 12 * 60, endMinute: 18 * 60 },
  { id: "dinner", label: "Ужин", startMinute: 18 * 60, endMinute: 19 * 60, requiredZone: "canteen" },
  { id: "free-time", label: "Вечер", startMinute: 19 * 60, endMinute: 22 * 60 },
  { id: "lights-out", label: "Отбой", startMinute: 22 * 60, endMinute: DAY_MINUTES, requiredZone: "cell" },
  { id: "lights-out", label: "Отбой", startMinute: 0, endMinute: 7 * 60, requiredZone: "cell" },
] as const;

export function scheduleAt(minuteOfDay: number): ScheduleBlock {
  const minute = ((minuteOfDay % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return SCHEDULE.find((block) => minute >= block.startMinute && minute < block.endMinute) ?? SCHEDULE[0];
}

export function minutesUntilScheduleChange(minuteOfDay: number): number {
  const current = scheduleAt(minuteOfDay);
  const minute = ((minuteOfDay % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  if (current.endMinute > minute) return current.endMinute - minute;
  return DAY_MINUTES - minute;
}

export function formatClock(minuteOfDay: number): string {
  const minute = ((Math.floor(minuteOfDay) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isSchedule(id: ScheduleId, minuteOfDay: number): boolean {
  return scheduleAt(minuteOfDay).id === id;
}
