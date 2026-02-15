export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class AppStorage {
  private prefix: string;
  private store: StorageLike;

  constructor(opts: { prefix: string; store?: StorageLike }) {
    this.prefix = opts.prefix;
    this.store = opts.store ?? window.localStorage;
  }

  key(k: string) {
    return `${this.prefix}:${k}`;
  }

  getString(k: string, fallback = ""): string {
    const v = this.store.getItem(this.key(k));
    return v ?? fallback;
  }

  setString(k: string, v: string) {
    this.store.setItem(this.key(k), v);
  }

  getJSON<T>(k: string, fallback: T): T {
    const raw = this.store.getItem(this.key(k));
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  setJSON<T>(k: string, v: T) {
    this.store.setItem(this.key(k), JSON.stringify(v));
  }

  remove(k: string) {
    this.store.removeItem(this.key(k));
  }
}

export const userStorage = new AppStorage({ prefix: "blackcrown" });
