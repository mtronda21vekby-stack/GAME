import { getMetricsKV, getUserIdCookie, type Env } from "../_lib/auth";
import {
  commerceCartFingerprint,
  commerceEntitlementsKey,
  commerceIdempotencyKey,
  commerceJson,
  commerceOrderIndexKey,
  commerceOrderKey,
  newCommerceId,
  readCommerceJson,
  safeIdempotencyKey,
  validateCommerceItems,
  type CommerceOrderV1,
  type EntitlementsV1,
  type IdempotencyRecordV1,
} from "../_lib/commerce";

type CheckoutBody = {
  items?: unknown;
  paymentMethod?: unknown;
  idempotencyKey?: unknown;
};

const ORDER_TTL = 365 * 24 * 60 * 60;
const USER_TTL = 180 * 24 * 60 * 60;

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

  const idempotencyKey = safeIdempotencyKey(request.headers.get("Idempotency-Key") || body.idempotencyKey);
  if (!idempotencyKey) return commerceJson({ ok: false, reason: "idempotency_key_required" }, 400);

  const validated = validateCommerceItems(body.items);
  if (!validated.ok) return commerceJson({ ok: false, reason: validated.reason }, 400);

  const cartFingerprint = commerceCartFingerprint(validated.items);
  const idempotencyStorageKey = commerceIdempotencyKey(userId, idempotencyKey);
  const existingIdempotency = await readCommerceJson<IdempotencyRecordV1>(kv, idempotencyStorageKey);
  if (existingIdempotency) {
    if (
      existingIdempotency.userId !== userId ||
      existingIdempotency.key !== idempotencyKey ||
      existingIdempotency.cartFingerprint !== cartFingerprint
    ) {
      return commerceJson({ ok: false, reason: "idempotency_conflict" }, 409);
    }
    const existingOrder = await readCommerceJson<CommerceOrderV1>(kv, commerceOrderKey(existingIdempotency.orderId));
    if (!existingOrder || existingOrder.userId !== userId) {
      return commerceJson({ ok: false, reason: "idempotency_record_stale" }, 409);
    }
    return commerceJson(
      { ok: true, order: existingOrder, idempotentReplay: true },
      200,
      { "Idempotency-Replayed": "true" },
    );
  }

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

  await kv.put(commerceOrderKey(orderId), JSON.stringify(order), { expirationTtl: ORDER_TTL });

  const entitlementKey = commerceEntitlementsKey(userId);
  const currentEntitlements = await readCommerceJson<EntitlementsV1>(kv, entitlementKey);
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

  const orderIndexKey = commerceOrderIndexKey(userId);
  const currentOrderIds = (await readCommerceJson<string[]>(kv, orderIndexKey)) ?? [];
  const orderIds = [orderId, ...currentOrderIds.filter((id) => id !== orderId)].slice(0, 50);
  await kv.put(orderIndexKey, JSON.stringify(orderIds), { expirationTtl: USER_TTL });

  order.status = "fulfilled";
  order.fulfilledAt = Date.now();
  await kv.put(commerceOrderKey(orderId), JSON.stringify(order), { expirationTtl: ORDER_TTL });

  const idempotencyRecord: IdempotencyRecordV1 = {
    v: 1,
    userId,
    key: idempotencyKey,
    cartFingerprint,
    orderId,
    createdAt: now,
  };
  await kv.put(idempotencyStorageKey, JSON.stringify(idempotencyRecord), { expirationTtl: ORDER_TTL });

  return commerceJson({ ok: true, order, idempotentReplay: false });
};
