import { COMMERCE_CATALOG, COMMERCE_CATALOG_BY_ID } from "../../../packages/commerce/src/catalog";

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

export type EntitlementsV1 = {
  v: 1;
  userId: string;
  itemIds: string[];
  updatedAt: number;
};

export type IdempotencyRecordV1 = {
  v: 1;
  userId: string;
  key: string;
  cartFingerprint: string;
  orderId: string;
  createdAt: number;
};

export { COMMERCE_CATALOG };

const MAX_LINES = 20;
const MAX_QUANTITY = 10;

function safeId(value: unknown) {
  return String(value ?? "").trim().slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, "");
}

export function validateCommerceItems(input: unknown):
  | { ok: true; items: ValidatedCommerceLine[]; total: number }
  | { ok: false; reason: "empty_cart" | "invalid_cart" | "unknown_item" | "invalid_quantity" } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, reason: "empty_cart" };
  if (input.length > MAX_LINES) return { ok: false, reason: "invalid_cart" };

  const quantities = new Map<string, number>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, reason: "invalid_cart" };
    const itemId = safeId((raw as { itemId?: unknown }).itemId);
    const quantity = Number((raw as { quantity?: unknown }).quantity);
    if (!itemId || !COMMERCE_CATALOG_BY_ID.has(itemId)) return { ok: false, reason: "unknown_item" };
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
    const item = COMMERCE_CATALOG_BY_ID.get(itemId);
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

export function safeIdempotencyKey(value: unknown) {
  const key = String(value ?? "").trim().slice(0, 120);
  if (key.length < 8 || !/^[a-zA-Z0-9._:-]+$/.test(key)) return "";
  return key;
}

export function commerceCartFingerprint(items: ValidatedCommerceLine[]) {
  return items
    .map((item) => `${item.itemId}:${item.quantity}:${item.unitPrice}`)
    .sort()
    .join("|");
}

export function commerceOrderKey(orderId: string) {
  return `commerce:order:v1:${orderId}`;
}

export function commerceEntitlementsKey(userId: string) {
  return `commerce:entitlements:v1:${userId}`;
}

export function commerceOrderIndexKey(userId: string) {
  return `commerce:orders:v1:${userId}`;
}

export function commerceIdempotencyKey(userId: string, key: string) {
  return `commerce:idempotency:v1:${userId}:${key}`;
}

export async function readCommerceJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function normalizeEntitlementItemIds(userId: string, stored: EntitlementsV1 | null) {
  if (!stored || stored.userId !== userId || !Array.isArray(stored.itemIds)) return [];
  return Array.from(new Set(stored.itemIds.filter((itemId) => COMMERCE_CATALOG_BY_ID.has(itemId))));
}
