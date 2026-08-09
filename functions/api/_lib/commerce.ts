export type CommerceCatalogItem = {
  id: string;
  title: string;
  price: number;
  category: "skins" | "badges" | "bundles";
};

export type ValidatedCommerceLine = {
  itemId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CommerceOrderV1 = {
  v: 1;
  id: string;
  userId: string;
  status: "paid" | "fulfilled";
  paymentMethod: "mock";
  currency: "BC";
  items: ValidatedCommerceLine[];
  total: number;
  createdAt: number;
  fulfilledAt?: number;
};

export const COMMERCE_CATALOG: readonly CommerceCatalogItem[] = [
  { id: "skin_aurora", title: "Aurora Skin", price: 720, category: "skins" },
  { id: "skin_neon_rush", title: "Neon Rush", price: 980, category: "skins" },
  { id: "skin_ocean_glass", title: "Ocean Glass", price: 760, category: "skins" },
  { id: "skin_solar_arc", title: "Solar Arc", price: 1040, category: "skins" },
  { id: "badge_founder", title: "Founder Badge", price: 420, category: "badges" },
  { id: "badge_royal", title: "Royal Badge", price: 650, category: "badges" },
  { id: "bundle_starter", title: "Starter Bundle", price: 1600, category: "bundles" },
  { id: "bundle_elite", title: "Elite Bundle", price: 2100, category: "bundles" },
] as const;

const MAX_LINES = 20;
const MAX_QUANTITY = 10;

function safeId(value: unknown) {
  return String(value ?? "").trim().slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, "");
}

function catalogMap() {
  return new Map(COMMERCE_CATALOG.map((item) => [item.id, item]));
}

export function validateCommerceItems(input: unknown):
  | { ok: true; items: ValidatedCommerceLine[]; total: number }
  | { ok: false; reason: "empty_cart" | "invalid_cart" | "unknown_item" | "invalid_quantity" } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, reason: "empty_cart" };
  if (input.length > MAX_LINES) return { ok: false, reason: "invalid_cart" };

  const catalog = catalogMap();
  const quantities = new Map<string, number>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, reason: "invalid_cart" };
    const itemId = safeId((raw as { itemId?: unknown }).itemId);
    const quantity = Number((raw as { quantity?: unknown }).quantity);
    if (!itemId || !catalog.has(itemId)) return { ok: false, reason: "unknown_item" };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { ok: false, reason: "invalid_quantity" };
    }
    const next = (quantities.get(itemId) ?? 0) + quantity;
    if (next > MAX_QUANTITY) return { ok: false, reason: "invalid_quantity" };
    quantities.set(itemId, next);
  }

  const items: ValidatedCommerceLine[] = [];
  let total = 0;
  for (const [itemId, quantity] of quantities) {
    const item = catalog.get(itemId);
    if (!item) return { ok: false, reason: "unknown_item" };
    const lineTotal = item.price * quantity;
    total += lineTotal;
    items.push({ itemId, title: item.title, quantity, unitPrice: item.price, lineTotal });
  }

  if (!Number.isSafeInteger(total) || total <= 0) return { ok: false, reason: "invalid_cart" };
  return { ok: true, items, total };
}

export function newCommerceId(prefix: string) {
  try {
    if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    // fall through
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function commerceJson(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(headers ?? {}),
    },
  });
}

export function safeCommerceOrderId(value: unknown) {
  return String(value ?? "").trim().slice(0, 120).replace(/[^a-zA-Z0-9_-]/g, "");
}
