import { COMMERCE_CATALOG, type CommerceCategory, type CommerceRarity } from "@blackcrown/commerce";
import { userStorage } from "@blackcrown/core";

export type StoreCategory = CommerceCategory;
export type StoreRarity = CommerceRarity;

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

export type StoreState = {
  wishlist: string[];
};

const KEY_WISHLIST = "store.wishlist";

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uniq(values: string[]) {
  return Array.from(new Set(values));
}

export function getStoreState(): StoreState {
  const wishlist = safeParseJSON<string[]>(userStorage.getString(KEY_WISHLIST, "[]"), []);
  return { wishlist: uniq(wishlist) };
}

function setStoreState(next: StoreState) {
  userStorage.setString(KEY_WISHLIST, JSON.stringify(uniq(next.wishlist)));
}

export function ensureStoreInit() {
  setStoreState(getStoreState());
}

export function formatCoins(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.max(0, Math.floor(value)));
}

export function rarityLabel(rarity: StoreRarity) {
  switch (rarity) {
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

export function rarityAccent(rarity: StoreRarity) {
  switch (rarity) {
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
  return COMMERCE_CATALOG.map((item) => ({
    id: item.id,
    title: item.title,
    desc: item.description,
    category: item.category,
    rarity: item.rarity,
    price: item.price,
    tags: [...item.tags],
    art: { ...item.art },
  }));
}

export function toggleWishlist(itemId: string) {
  const state = getStoreState();
  const wishlist = state.wishlist.includes(itemId)
    ? state.wishlist.filter((id) => id !== itemId)
    : uniq([...state.wishlist, itemId]);
  const next = { wishlist };
  setStoreState(next);
  return next;
}
