import { getMetricsKV, getUserIdCookie, type Env } from "../_lib/auth";
import {
  commerceJson,
  newCommerceId,
  validateCommerceItems,
  type CommerceOrderV1,
} from "../_lib/commerce";

type CheckoutBody = {
  items?: unknown;
  paymentMethod?: unknown;
};

type EntitlementsV1 = {
  v: 1;
  userId: string;
  itemIds: string[];
  updatedAt: number;
};

const ORDER_TTL = 365 * 24 * 60 * 60;
const USER_TTL = 180 * 24 * 60 * 60;

async function readJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return commerceJson({ ok: false, reason: "commerce_storage_unavailable" }, 503);

  const userId = getUserIdCookie(request)?.trim();
  if (!userId) return commerceJson({ ok: false, reason: "auth_required" }, 401);

  let body: CheckoutBody = {};
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return commerceJson({ ok: false, reason: "invalid_json" }, 400);
  }

  if (body.paymentMethod !== "mock") {
    return commerceJson({ ok: false, reason: "unsupported_payment_method" }, 400);
  }

  const validated = validateCommerceItems(body.items);
  if (!validated.ok) return commerceJson({ ok: false, reason: validated.reason }, 400);

  const now = Date.now();
  const orderId = newCommerceId("ord");
  const order: CommerceOrderV1 = {
    v: 1,
    id: orderId,
    userId,
    status: "paid",
    paymentMethod: "mock",
    currency: "BC",
    items: validated.items,
    total: validated.total,
    createdAt: now,
  };

  await kv.put(`commerce:order:v1:${orderId}`, JSON.stringify(order), { expirationTtl: ORDER_TTL });

  const entitlementKey = `commerce:entitlements:v1:${userId}`;
  const currentEntitlements = await readJson<EntitlementsV1>(kv, entitlementKey);
  const itemIds = Array.from(new Set([
    ...(currentEntitlements?.itemIds ?? []),
    ...validated.items.map((item) => item.itemId),
  ])).slice(0, 500);

  const entitlements: EntitlementsV1 = {
    v: 1,
    userId,
    itemIds,
    updatedAt: now,
  };
  await kv.put(entitlementKey, JSON.stringify(entitlements), { expirationTtl: USER_TTL });

  const orderIndexKey = `commerce:orders:v1:${userId}`;
  const currentOrderIds = (await readJson<string[]>(kv, orderIndexKey)) ?? [];
  const orderIds = [orderId, ...currentOrderIds.filter((id) => id !== orderId)].slice(0, 50);
  await kv.put(orderIndexKey, JSON.stringify(orderIds), { expirationTtl: USER_TTL });

  order.status = "fulfilled";
  order.fulfilledAt = Date.now();
  await kv.put(`commerce:order:v1:${orderId}`, JSON.stringify(order), { expirationTtl: ORDER_TTL });

  return commerceJson({ ok: true, order });
};
