import type { SchedulePhaseId } from "./model";

export type SchedulePhase = {
  id: SchedulePhaseId;
  label: string;
  start: number;
  end: number;
};

export const DAY_SCHEDULE: readonly SchedulePhase[] = [
  { id: "roll-call", label: "ROLL CALL", start: 7 * 60, end: 7 * 60 + 30 },
  { id: "breakfast", label: "BREAKFAST", start: 7 * 60 + 30, end: 8 * 60 + 30 },
  { id: "work-am", label: "WORK · MAINTENANCE", start: 8 * 60 + 30, end: 11 * 60 + 30 },
  { id: "free-noon", label: "FREE TIME", start: 11 * 60 + 30, end: 13 * 60 },
  { id: "lunch", label: "LUNCH", start: 13 * 60, end: 14 * 60 },
  { id: "work-pm", label: "WORK · MAINTENANCE", start: 14 * 60, end: 17 * 60 },
  { id: "free-evening", label: "FREE TIME", start: 17 * 60, end: 18 * 60 },
  { id: "dinner", label: "DINNER", start: 18 * 60, end: 19 * 60 },
  { id: "free-evening", label: "EVENING REC", start: 19 * 60, end: 21 * 60 },
  { id: "lockup", label: "LOCKUP", start: 21 * 60, end: 24 * 60 },
  { id: "lockup", label: "LOCKUP", start: 0, end: 7 * 60 },
];

export function phaseAt(minuteOfDay: number): SchedulePhase {
  const minute = ((minuteOfDay % 1440) + 1440) % 1440;
  return DAY_SCHEDULE.find((phase) => minute >= phase.start && minute < phase.end) ?? DAY_SCHEDULE[0];
}

export function formatClock(minuteOfDay: number): string {
  const minute = Math.floor(((minuteOfDay % 1440) + 1440) % 1440);
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function maintenanceAuthorized(id: SchedulePhaseId): boolean {
  return id === "work-am" || id === "work-pm";
}
