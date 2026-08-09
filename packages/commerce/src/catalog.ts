export type CommerceCategory = "skins" | "badges" | "bundles";
export type CommerceRarity = "common" | "rare" | "epic" | "legendary";

export type CommerceCatalogItem = {
  id: string;
  title: string;
  description: string;
  category: CommerceCategory;
  rarity: CommerceRarity;
  price: number;
  tags: readonly string[];
  art: {
    gradient: string;
    glow: string;
  };
};

export const COMMERCE_CATALOG = [
  {
    id: "skin_aurora",
    title: "Aurora Skin",
    description: "Холодный неон, чистая типографика, мягкое свечение.",
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
    description: "Контраст и скорость. Подходит для динамичных сцен.",
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
    description: "Светлая глубина и чистое стекло, без визуального шума.",
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
    description: "Тёплый градиент, аккуратное свечение, эффект дорогого объекта.",
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
    description: "Значок профиля: лаконичный статус в интерфейсе.",
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
    description: "Премиальный акцент: королевская палитра.",
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
    description: "Набор для быстрого старта: два скина и бейдж.",
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
    description: "Элитный набор: эпические акценты и редкий статус.",
    category: "bundles",
    rarity: "legendary",
    price: 2100,
    tags: ["Elite", "Bundle", "Legendary"],
    art: {
      gradient: "linear-gradient(135deg, rgba(2,6,23,0.92), rgba(30,64,175,0.92))",
      glow: "radial-gradient(circle at 35% 25%, rgba(30,64,175,0.45), transparent 55%), radial-gradient(circle at 75% 70%, rgba(2,6,23,0.20), transparent 62%)",
    },
  },
] as const satisfies readonly CommerceCatalogItem[];

export type CommerceItemId = (typeof COMMERCE_CATALOG)[number]["id"];

export const COMMERCE_CATALOG_BY_ID = new Map<string, CommerceCatalogItem>(
  COMMERCE_CATALOG.map((item) => [item.id, item]),
);

export function getCommerceCatalogItem(itemId: string) {
  return COMMERCE_CATALOG_BY_ID.get(itemId);
}
