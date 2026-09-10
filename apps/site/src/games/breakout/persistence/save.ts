import type { GameSnapshot } from "../domain";

export interface SavePort {
  load(): GameSnapshot | null;
  save(snapshot: GameSnapshot): void;
  clear(): void;
}

export class LocalStorageSavePort implements SavePort {
  constructor(private readonly key = "bc.breakout.save.v1") {}

  load(): GameSnapshot | null {
    try {
      const raw = window.localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as GameSnapshot) : null;
    } catch {
      return null;
    }
  }

  save(snapshot: GameSnapshot) {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(snapshot));
    } catch {
      // The game remains playable in privacy-restricted browsers; persistence is best-effort.
    }
  }

  clear() {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      // no-op
    }
  }
}
