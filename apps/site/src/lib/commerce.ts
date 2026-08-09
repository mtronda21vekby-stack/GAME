import { userStorage } from "@blackcrown/core";
import { getStoreItems, type StoreItem } from "./store";

export type CartLine = {
  itemId: string;
  quantity: number;
};

export type CartItem = {
  item: StoreItem;
  quantity: number;
  lineTotal: number;
};

export type CommerceQuote = {
  ok: true;
  quoteId: string;
  currency: "BC";
  items: Array<{
    itemId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
};

export type CommerceOrder = {
  id: string;
  userId: string;
  status: "paid" | "fulfilled";
  paymentMethod: "mock";
  currency: "BC";
  items: CommerceQuote["items"];
  total: number;
  createdAt: number;
  fulfilledAt?: number;
};

const CART_KEY = "commerce.cart.v1";
const MAX_QUANTITY = 10;
const MAX_LINES = 20;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_QUANTITY, Math.floor(value)));
}

function catalogMap() {
  return new Map(getStoreItems().map((item) => [item.id, item]));
}

function normalizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const catalog = catalogMap();
  const quantities = new Map<string, number>();

  for (const entry of raw.slice(0, MAX_LINES * 2)) {
    if (!entry || typeof entry !== "object") continue;
    const itemId = String((entry as { itemId?: unknown }).itemId ?? "").trim();
    if (!catalog.has(itemId)) continue;
    const quantity = clampQuantity(Number((entry as { quantity?: unknown }).quantity ?? 1));
    quantities.set(itemId, Math.min(MAX_QUANTITY, (quantities.get(itemId) ?? 0) + quantity));
    if (quantities.size >= MAX_LINES) break;
  }

  return Array.from(quantities, ([itemId, quantity]) => ({ itemId, quantity }));
}

function writeCart(lines: CartLine[]) {
  const normalized = normalizeLines(lines);
  userStorage.setString(CART_KEY, JSON.stringify(normalized));
  emitCartChanged(normalized);
  return normalized;
}

function emitCartChanged(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("bc:cart-changed", {
      detail: { count: lines.reduce((sum, line) => sum + line.quantity, 0) },
    })
  );
}

export function getCartLines(): CartLine[] {
  return normalizeLines(safeParse<unknown>(userStorage.getString(CART_KEY, "[]"), []));
}

export function getCartItems(): CartItem[] {
  const catalog = catalogMap();
  return getCartLines().flatMap((line) => {
    const item = catalog.get(line.itemId);
    if (!item) return [];
    return [{ item, quantity: line.quantity, lineTotal: item.price * line.quantity }];
  });
}

export function getCartCount() {
  return getCartLines().reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartTotal() {
  return getCartItems().reduce((sum, line) => sum + line.lineTotal, 0);
}

export function addToCart(itemId: string, quantity = 1) {
  const catalog = catalogMap();
  if (!catalog.has(itemId)) return getCartLines();

  const lines = getCartLines();
  const existing = lines.find((line) => line.itemId === itemId);
  if (existing) {
    existing.quantity = clampQuantity(existing.quantity + quantity);
  } else if (lines.length < MAX_LINES) {
    lines.push({ itemId, quantity: clampQuantity(quantity) });
  }
  return writeCart(lines);
}

export function setCartQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) return removeFromCart(itemId);
  const lines = getCartLines();
  const existing = lines.find((line) => line.itemId === itemId);
  if (!existing) return lines;
  existing.quantity = clampQuantity(quantity);
  return writeCart(lines);
}

export function removeFromCart(itemId: string) {
  return writeCart(getCartLines().filter((line) => line.itemId !== itemId));
}

export function clearCart() {
  return writeCart([]);
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function requestLines() {
  return getCartLines().map(({ itemId, quantity }) => ({ itemId, quantity }));
}

export async function requestCommerceQuote(signal?: AbortSignal): Promise<CommerceQuote> {
  const response = await fetch("/api/commerce/quote", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    credentials: "include",
    cache: "no-store",
    signal,
    body: JSON.stringify({ items: requestLines() }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok !== true) {
    throw new Error(typeof payload.reason === "string" ? payload.reason : "quote_failed");
  }
  return payload as unknown as CommerceQuote;
}

export async function submitMockCheckout(signal?: AbortSignal): Promise<CommerceOrder> {
  const response = await fetch("/api/commerce/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    credentials: "include",
    cache: "no-store",
    signal,
    body: JSON.stringify({ items: requestLines(), paymentMethod: "mock" }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok !== true || !payload.order) {
    throw new Error(typeof payload.reason === "string" ? payload.reason : "checkout_failed");
  }
  return payload.order as CommerceOrder;
}

export async function getCommerceOrder(orderId: string, signal?: AbortSignal): Promise<CommerceOrder> {
  const safeId = encodeURIComponent(orderId.trim());
  const response = await fetch(`/api/commerce/orders/${safeId}`, {
    headers: { accept: "application/json" },
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok !== true || !payload.order) {
    throw new Error(typeof payload.reason === "string" ? payload.reason : "order_not_found");
  }
  return payload.order as CommerceOrder;
}
