import { DAY_MINUTES, isSchedule, scheduleAt } from "./schedule";
import type { EscapeObjective, EscapeObjectiveId, GameSnapshot, ItemId, SimulationContext } from "./model";

const BASE_OBJECTIVES: readonly EscapeObjective[] = [
  { id: "attend-roll-call", label: "Отметиться на утренней перекличке", completed: false },
  { id: "find-metal-strip", label: "Найти тонкую металлическую пластину", completed: false },
  { id: "find-cloth-tape", label: "Добыть тканевую ленту в мастерской", completed: false },
  { id: "craft-service-shim", label: "Собрать самодельный сервисный ключ", completed: false },
  { id: "reach-maintenance", label: "Проникнуть в служебную зону", completed: false },
] as const;

export function createInitialSnapshot(): GameSnapshot {
  return {
    version: 1,
    day: 1,
    minuteOfDay: 7 * 60 + 24,
    stats: {
      health: 100,
      stamina: 100,
      suspicion: 5,
      reputation: 0,
      money: 12,
      strength: 1,
      intelligence: 1,
    },
    inventory: [],
    objectives: BASE_OBJECTIVES.map((objective) => ({ ...objective })),
    flags: {
      lockerSearched: false,
      workshopBinSearched: false,
      serviceHatchUnlocked: false,
      firstRouteComplete: false,
      rollCallAttendedToday: false,
    },
    capturedCount: 0,
  };
}

export function hasItem(snapshot: GameSnapshot, itemId: ItemId, quantity = 1): boolean {
  return (snapshot.inventory.find((slot) => slot.itemId === itemId)?.quantity ?? 0) >= quantity;
}

export function addItem(snapshot: GameSnapshot, itemId: ItemId, quantity = 1): GameSnapshot {
  const inventory = snapshot.inventory.map((slot) => ({ ...slot }));
  const slot = inventory.find((candidate) => candidate.itemId === itemId);
  if (slot) slot.quantity += quantity;
  else inventory.push({ itemId, quantity });
  return { ...snapshot, inventory };
}

export function removeItem(snapshot: GameSnapshot, itemId: ItemId, quantity = 1): GameSnapshot {
  const inventory = snapshot.inventory
    .map((slot) => (slot.itemId === itemId ? { ...slot, quantity: slot.quantity - quantity } : { ...slot }))
    .filter((slot) => slot.quantity > 0);
  return { ...snapshot, inventory };
}

export function completeObjective(snapshot: GameSnapshot, id: EscapeObjectiveId): GameSnapshot {
  return {
    ...snapshot,
    objectives: snapshot.objectives.map((objective) =>
      objective.id === id ? { ...objective, completed: true } : { ...objective },
    ),
  };
}

export function searchLocker(snapshot: GameSnapshot): { snapshot: GameSnapshot; message: string } {
  if (snapshot.flags.lockerSearched) return { snapshot, message: "Шкафчик уже пуст." };
  let next = addItem(snapshot, "metal-strip");
  next = completeObjective(next, "find-metal-strip");
  next = { ...next, flags: { ...next.flags, lockerSearched: true } };
  return { snapshot: next, message: "Найдена тонкая металлическая пластина." };
}

export function searchWorkshopBin(snapshot: GameSnapshot): { snapshot: GameSnapshot; message: string } {
  if (snapshot.flags.workshopBinSearched) return { snapshot, message: "В ящике больше ничего полезного." };
  let next = addItem(snapshot, "cloth-tape");
  next = completeObjective(next, "find-cloth-tape");
  next = { ...next, flags: { ...next.flags, workshopBinSearched: true } };
  return { snapshot: next, message: "Найдена тканевая лента." };
}

export function craftServiceShim(snapshot: GameSnapshot): { snapshot: GameSnapshot; message: string; ok: boolean } {
  if (hasItem(snapshot, "service-shim")) return { snapshot, message: "Сервисный ключ уже собран.", ok: false };
  if (!hasItem(snapshot, "metal-strip") || !hasItem(snapshot, "cloth-tape")) {
    return { snapshot, message: "Нужны металлическая пластина и тканевая лента.", ok: false };
  }
  let next = removeItem(snapshot, "metal-strip");
  next = removeItem(next, "cloth-tape");
  next = addItem(next, "service-shim");
  next = completeObjective(next, "craft-service-shim");
  next = { ...next, stats: { ...next.stats, intelligence: next.stats.intelligence + 1 } };
  return { snapshot: next, message: "Собран самодельный сервисный ключ.", ok: true };
}

export function unlockServiceHatch(snapshot: GameSnapshot): { snapshot: GameSnapshot; message: string; ok: boolean } {
  if (snapshot.flags.serviceHatchUnlocked) return { snapshot, message: "Служебный люк уже открыт.", ok: true };
  if (!hasItem(snapshot, "service-shim")) return { snapshot, message: "Замок не поддаётся. Нужен подходящий инструмент.", ok: false };
  const next = {
    ...snapshot,
    flags: { ...snapshot.flags, serviceHatchUnlocked: true },
    stats: { ...snapshot.stats, suspicion: Math.min(100, snapshot.stats.suspicion + 8) },
  };
  return { snapshot: next, message: "Замок поддался. Служебный проход открыт.", ok: true };
}

export function reachMaintenance(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.flags.firstRouteComplete) return snapshot;
  let next = completeObjective(snapshot, "reach-maintenance");
  next = {
    ...next,
    flags: { ...next.flags, firstRouteComplete: true },
    stats: { ...next.stats, reputation: next.stats.reputation + 10, money: next.stats.money + 25 },
  };
  return next;
}

export function tickSimulation(snapshot: GameSnapshot, elapsedRealSeconds: number, context: SimulationContext): GameSnapshot {
  if (elapsedRealSeconds <= 0) return snapshot;

  // Prototype pacing: one real second equals one in-game minute.
  const previousMinute = snapshot.minuteOfDay;
  let minuteOfDay = previousMinute + elapsedRealSeconds;
  let day = snapshot.day;
  let flags = { ...snapshot.flags };
  while (minuteOfDay >= DAY_MINUTES) {
    minuteOfDay -= DAY_MINUTES;
    day += 1;
    flags.rollCallAttendedToday = false;
  }

  let suspicion = snapshot.stats.suspicion;
  const active = scheduleAt(minuteOfDay);
  const requiredZone = active.requiredZone;
  const compliant = !requiredZone || context.playerZone === requiredZone;

  if (!compliant) suspicion += elapsedRealSeconds * (context.guardCanSeePlayer ? 4.5 : 1.2);
  else suspicion -= elapsedRealSeconds * 1.5;

  if (context.guardCanSeePlayer && context.playerZone === "maintenance") suspicion += elapsedRealSeconds * 7;

  let next: GameSnapshot = {
    ...snapshot,
    day,
    minuteOfDay,
    flags,
    stats: {
      ...snapshot.stats,
      suspicion: Math.max(0, Math.min(100, suspicion)),
      stamina: Math.max(20, Math.min(100, snapshot.stats.stamina + elapsedRealSeconds * 0.8)),
    },
  };

  if (isSchedule("roll-call", minuteOfDay) && context.playerZone === "roll-call" && !next.flags.rollCallAttendedToday) {
    next = completeObjective(next, "attend-roll-call");
    next = { ...next, flags: { ...next.flags, rollCallAttendedToday: true } };
  }

  return next;
}

export function capturePlayer(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    capturedCount: snapshot.capturedCount + 1,
    stats: {
      ...snapshot.stats,
      health: 100,
      stamina: 100,
      suspicion: 18,
      money: Math.max(0, snapshot.stats.money - 3),
    },
  };
}
