import type { GameSnapshot } from "../simulation/model";
import { createInitialSnapshot } from "../simulation/state";

export interface SaveRepository {
  load(): GameSnapshot;
  save(snapshot: GameSnapshot): void;
  clear(): void;
}

const STORAGE_KEY = "bc.world.breakout.v1";

function isSnapshot(value: unknown): value is GameSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameSnapshot>;
  return candidate.version === 1 && typeof candidate.day === "number" && typeof candidate.minuteOfDay === "number";
}

export class LocalSaveRepository implements SaveRepository {
  load(): GameSnapshot {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialSnapshot();
      const parsed: unknown = JSON.parse(raw);
      return isSnapshot(parsed) ? parsed : createInitialSnapshot();
    } catch {
      return createInitialSnapshot();
    }
  }

  save(snapshot: GameSnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // The game remains playable in privacy/restricted storage modes.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }
}

export const BREAKOUT_SAVE_NAMESPACE = STORAGE_KEY;
