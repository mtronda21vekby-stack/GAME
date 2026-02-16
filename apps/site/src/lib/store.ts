import { userStorage } from "@blackcrown/core";

export type StoreCategory = "skins" | "badges" | "bundles";

export type StoreRarity = "common" | "rare" | "epic" | "legendary";

export type StoreItem = {
  id: string;
  title: string;
  desc: string;
  category: StoreCategory;
  rarity: StoreRarity;
  price: number;
  tags: string[];
  art: {
    gradient: string;
    glow: string;
  };
};

export type StoreTx = {
  id: string;
  type: "buy" | "credit" | "wishlist";
  itemId?: string;
  amount?: number;
  at: number;
};

export type StoreState = {
  balance: number;
  owned: string[];
  wishlist: string[];
  tx: StoreTx[];
};

const KEY_BALANCE = "store.balance";
const KEY_OWNED = "store.owned";
const KEY_WISHLIST = "store.wishlist";
const KEY_TX = "store.tx";

const DEFAULT_BALANCE = 2500;

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function clampTx(tx: StoreTx[]) {
  return tx.slice(-50);
}

function nowId(prefix: string) {
  const r = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${r}`;
}

export function getStoreState(): StoreState {
  const balance = Number(userStorage.getString(KEY_BALANCE, String(DEFAULT_BALANCE)) || DEFAULT_BALANCE);
  const owned = safeParseJSON<string[]>(userStorage.getString(KEY_OWNED, "[]"), []);
  const wishlist = safeParseJSON<string[]>(userStorage.getString(KEY_WISHLIST, "[]"), []);
  const tx = safeParseJSON<StoreTx[]>(userStorage.getString(KEY_TX, "[]"), []);

  return {
    balance: Number.isFinite(balance) ? balance : DEFAULT_BALANCE,
    owned: uniq(owned),
    wishlist: uniq(wishlist),
    tx: clampTx(tx),
  };
}

export function setStoreState(next: StoreState) {
  userStorage.setString(KEY_BALANCE, String(next.balance));
  userStorage.setString(KEY_OWNED, JSON.stringify(uniq(next.owned)));
  userStorage.setString(KEY_WISHLIST, JSON.stringify(uniq(next.wishlist)));
  userStorage.setString(KEY_TX, JSON.stringify(clampTx(next.tx)));
}

export function ensureStoreInit() {
  const s = getStoreState();
  setStoreState(s);
}

export function formatCoins(n: number) {
  const v = Math.max(0, Math.floor(n));
  return new Intl.NumberFormat("ru-RU").format(v);
}

export function rarityLabel(r: StoreRarity) {
  switch (r) {
    case "common":
      return "Common";
    case "rare":
      return "Rare";
    case "epic":
      return "Epic";
    case "legendary":
      return "Legendary";
  }
}

export function rarityAccent(r: StoreRarity) {
  switch (r) {
    case "common":
      return "rgba(255,255,255,0.70)";
    case "rare":
      return "rgba(125,211,252,0.92)";
    case "epic":
      return "rgba(216,180,254,0.92)";
    case "legendary":
      return "rgba(251,191,36,0.92)";
  }
}

export function getStoreItems(): StoreItem[] {
  return [
    {
      id: "skin_aurora",
      title: "Aurora Skin",
      desc: "Холодный неон, чистая типографика, мягкое свечение.",
      category: "skins",
      rarity: "rare",
      price: 720,
      tags: ["Neon", "Glass", "Premium"],
      art: {
        gradient: "linear-gradient(135deg, rgba(94,234,212,0.92), rgba(99,102,241,0.92))",
        glow: "radial-gradient(circle at 30% 20%, rgba(94,234,212,0.40), transparent 55%), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.35), transparent 60%)",
      },
    },
    {
      id: "skin_neon_rush",
      title: "Neon Rush",
      desc: "Контраст и скорость. Подходит для динамичных сцен.",
      category: "skins",
      rarity: "epic",
      price: 980,
      tags: ["Speed", "Contrast", "Epic"],
      art: {
        gradient: "linear-gradient(135deg, rgba(251,113,133,0.92), rgba(147,51,234,0.92))",
        glow: "radial-gradient(circle at 20% 25%, rgba(251,113,133,0.40), transparent 55%), radial-gradient(circle at 80% 70%, rgba(147,51,234,0.35), transparent 60%)",
      },
    },
    {
      id: "skin_ocean_glass",
      title: "Ocean Glass",
      desc: "Светлая глубина и чистое стекло, без визуального шума.",
      category: "skins",
      rarity: "rare",
      price: 760,
      tags: ["Ocean", "Clean", "Glass"],
      art: {
        gradient: "linear-gradient(135deg, rgba(56,189,248,0.92), rgba(34,197,94,0.92))",
        glow: "radial-gradient(circle at 35% 25%, rgba(56,189,248,0.40), transparent 55%), radial-gradient(circle at 75% 65%, rgba(34,197,94,0.32), transparent 60%)",
      },
    },
    {
      id: "skin_solar_arc",
      title: "Solar Arc",
      desc: "Тёплый градиент, аккуратное свечение, эффект “дорого”.",
      category: "skins",
      rarity: "epic",
      price: 1040,
      tags: ["Warm", "Arc", "Epic"],
      art: {
        gradient: "linear-gradient(135deg, rgba(245,158,11,0.92), rgba(239,68,68,0.92))",
        glow: "radial-gradient(circle at 35% 30%, rgba(245,158,11,0.42), transparent 55%), radial-gradient(circle at 75% 70%, rgba(239,68,68,0.32), transparent 60%)",
      },
    },
    {
      id: "badge_founder",
      title: "Founder Badge",
      desc: "Значок профиля: лаконичный статус в интерфейсе.",
      category: "badges",
      rarity: "rare",
      price: 420,
      tags: ["Profile", "Status", "Rare"],
      art: {
        gradient: "linear-gradient(135deg, rgba(148,163,184,0.92), rgba(71,85,105,0.92))",
        glow: "radial-gradient(circle at 30% 20%, rgba(148,163,184,0.35), transparent 58%), radial-gradient(circle at 70% 70%, rgba(71,85,105,0.30), transparent 62%)",
      },
    },
    {
      id: "badge_royal",
      title: "Royal Badge",
      desc: "Премиальный акцент: королевская палитра.",
      category: "badges",
      rarity: "epic",
      price: 650,
      tags: ["Royal", "Premium", "Epic"],
      art: {
        gradient: "linear-gradient(135deg, rgba(99,102,241,0.92), rgba(236,72,153,0.92))",
        glow: "radial-gradient(circle at 25% 25%, rgba(99,102,241,0.38), transparent 55%), radial-gradient(circle at 75% 70%, rgba(236,72,153,0.30), transparent 62%)",
      },
    },
    {
      id: "bundle_starter",
      title: "Starter Bundle",
      desc: "Набор для быстрого старта: 2 скина + бейдж.",
      category: "bundles",
      rarity: "legendary",
      price: 1600,
      tags: ["Bundle", "Value", "Legendary"],
      art: {
        gradient: "linear-gradient(135deg, rgba(251,191,36,0.92), rgba(99,102,241,0.92))",
        glow: "radial-gradient(circle at 30% 25%, rgba(251,191,36,0.40), transparent 55%), radial-gradient(circle at 70% 70%, rgba(99,102,241,0.35), transparent 62%)",
      },
    },
    {
      id: "bundle_elite",
      title: "Elite Bundle",
      desc: "Элитный набор: эпик-акценты + редкий статус.",
      category: "bundles",
      rarity: "legendary",
      price: 2100,
      tags: ["Elite", "Bundle", "Legendary"],
      art: {
        gradient: "linear-gradient(135deg, rgba(2,6,23,0.92), rgba(30,64,175,0.92))",
        glow: "radial-gradient(circle at 35% 25%, rgba(30,64,175,0.45), transparent 55%), radial-gradient(circle at 75% 70%, rgba(2,6,23,0.20), transparent 62%)",
      },
    },
  ];
}

export function buyItem(item: StoreItem): { ok: true; state: StoreState } | { ok: false; reason: "owned" | "insufficient"; state: StoreState } {
  const s = getStoreState();

  if (s.owned.includes(item.id)) return { ok: false, reason: "owned", state: s };
  if (s.balance < item.price) return { ok: false, reason: "insufficient", state: s };

  const next: StoreState = {
    ...s,
    balance: s.balance - item.price,
    owned: uniq([...s.owned, item.id]),
    tx: clampTx([
      ...s.tx,
      { id: nowId("tx"), type: "buy", itemId: item.id, amount: -item.price, at: Date.now() },
    ]),
  };

  setStoreState(next);
  return { ok: true, state: next };
}

export function toggleWishlist(itemId: string) {
  const s = getStoreState();
  const has = s.wishlist.includes(itemId);

  const next: StoreState = {
    ...s,
    wishlist: has ? s.wishlist.filter((x) => x !== itemId) : uniq([...s.wishlist, itemId]),
    tx: clampTx([
      ...s.tx,
      { id: nowId("tx"), type: "wishlist", itemId, at: Date.now() },
    ]),
  };

  setStoreState(next);
  return next;
}

export function addCredit(amount: number) {
  const s = getStoreState();
  const add = Math.max(0, Math.floor(amount));

  const next: StoreState = {
    ...s,
    balance: s.balance + add,
    tx: clampTx([
      ...s.tx,
      { id: nowId("tx"), type: "credit", amount: add, at: Date.now() },
    ]),
  };

  setStoreState(next);
  return next;
}
