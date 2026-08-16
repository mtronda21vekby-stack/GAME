import { beforeEach, describe, expect, it } from "vitest";
import {
  commerceEntitlementsKey,
  commerceOrderIndexKey,
  commerceOrderKey,
  normalizeEntitlementItemIds,
  safeIdempotencyKey,
  validateCommerceItems,
  type CommerceOrderV1,
  type EntitlementsV1,
} from "../../../../functions/api/_lib/commerce";
import { createUserSessionToken } from "../../../../functions/api/_lib/user-session";
import { onRequestPost as checkout } from "../../../../functions/api/commerce/checkout";
import { onRequestGet as entitlements } from "../../../../functions/api/commerce/entitlements";
import { onRequestGet as getOrder } from "../../../../functions/api/commerce/orders/[id]";

const TEST_SESSION_SECRET = "unit-test-session-secret-with-sufficient-entropy";

class FakeKV {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async put(key: string, value: string) { this.values.set(key, value); }
}

function context(
  request: Request,
  kv: FakeKV,
  params: Record<string, string> = {},
  envOverrides: Record<string, unknown> = {},
) {
  return {
    request,
    env: {
      BC_KV: kv,
      BC_USER_SESSION_SECRET: TEST_SESSION_SECRET,
      BC_COMMERCE_MOCK_ENABLED: "1",
      ...envOverrides,
    },
    params,
  } as never;
}

async function signedCookie(userId: string) {
  const token = await createUserSessionToken(
    { BC_USER_SESSION_SECRET: TEST_SESSION_SECRET },
    userId,
  );
  if (!token) throw new Error("failed_to_create_test_session");
  return `bc_session=${token}`;
}

async function checkoutRequest(userId: string | null, key: string, items: unknown) {
  const headers = new Headers({ "content-type": "application/json", "Idempotency-Key": key });
  if (userId) headers.set("cookie", await signedCookie(userId));
  return new Request("https://blackcrown.test/api/commerce/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify({ items, paymentMethod: "mock", idempotencyKey: key }),
  });
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("catalog validation", () => {
  it("ignores client price tampering", () => {
    const result = validateCommerceItems([{ itemId: "skin_aurora", quantity: 2, price: 1 }]);
    expect(result).toMatchObject({ ok: true, total: 1440 });
    if (result.ok) expect(result.items[0]).toMatchObject({ unitPrice: 720, lineTotal: 1440 });
  });

  it("rejects unknown, empty, and invalid quantities", () => {
    expect(validateCommerceItems([])).toEqual({ ok: false, reason: "empty_cart" });
    expect(validateCommerceItems([{ itemId: "unknown", quantity: 1 }])).toEqual({ ok: false, reason: "unknown_item" });
    expect(validateCommerceItems([{ itemId: "skin_aurora", quantity: 0 }])).toEqual({ ok: false, reason: "invalid_quantity" });
    expect(validateCommerceItems([{ itemId: "skin_aurora", quantity: 11 }])).toEqual({ ok: false, reason: "invalid_quantity" });
  });

  it("normalizes duplicate lines", () => {
    const result = validateCommerceItems([
      { itemId: "skin_aurora", quantity: 2 },
      { itemId: "skin_aurora", quantity: 3 },
    ]);
    expect(result).toMatchObject({ ok: true, total: 3600 });
    if (result.ok) expect(result.items).toHaveLength(1);
  });

  it("bounds and validates idempotency keys", () => {
    expect(safeIdempotencyKey("short")).toBe("");
    expect(safeIdempotencyKey("checkout:valid-key_1")).toBe("checkout:valid-key_1");
    expect(safeIdempotencyKey("bad key with spaces")).toBe("");
  });
});

describe("checkout and ownership", () => {
  let kv: FakeKV;
  beforeEach(() => { kv = new FakeKV(); });

  it("rejects an unauthenticated checkout", async () => {
    const request = await checkoutRequest(null, "checkout:key-1", [{ itemId: "skin_aurora", quantity: 1 }]);
    const response = await checkout(context(request, kv));
    expect(response.status).toBe(401);
    expect(await json(response)).toMatchObject({ reason: "auth_required" });
  });

  it("does not trust the legacy raw bc_uid cookie", async () => {
    const request = new Request("https://blackcrown.test/api/commerce/entitlements", {
      headers: { cookie: "bc_uid=user-a" },
    });
    const response = await entitlements(context(request, kv));
    expect(response.status).toBe(401);
    expect(await json(response)).toMatchObject({ reason: "auth_required" });
  });

  it("fails closed when mock payment is not explicitly enabled", async () => {
    const request = await checkoutRequest("user-a", "checkout:key-disabled", [{ itemId: "skin_aurora", quantity: 1 }]);
    const response = await checkout(context(request, kv, {}, { BC_COMMERCE_MOCK_ENABLED: "0" }));
    expect(response.status).toBe(503);
    expect(await json(response)).toMatchObject({ reason: "payment_provider_unavailable" });
    expect(kv.values.has(commerceEntitlementsKey("user-a"))).toBe(false);
  });

  it("replays one order for a duplicate idempotency key and grants once", async () => {
    const firstRequest = await checkoutRequest("user-a", "checkout:key-2", [{ itemId: "skin_aurora", quantity: 1 }]);
    const firstResponse = await checkout(context(firstRequest, kv));
    expect(firstResponse.status).toBe(200);
    const first = await json(firstResponse) as { order: CommerceOrderV1 };

    const secondRequest = await checkoutRequest("user-a", "checkout:key-2", [{ itemId: "skin_aurora", quantity: 1 }]);
    const secondResponse = await checkout(context(secondRequest, kv));
    expect(secondResponse.status).toBe(200);
    const second = await json(secondResponse) as { order: CommerceOrderV1; idempotentReplay: boolean };

    expect(first.order.id).toBe(second.order.id);
    expect(second.idempotentReplay).toBe(true);
    const owned = JSON.parse(kv.values.get(commerceEntitlementsKey("user-a")) || "{}") as EntitlementsV1;
    const orderIds = JSON.parse(kv.values.get(commerceOrderIndexKey("user-a")) || "[]") as string[];
    expect(owned.itemIds).toEqual(["skin_aurora"]);
    expect(orderIds).toEqual([first.order.id]);
  });

  it("does not expose a foreign order", async () => {
    const order: CommerceOrderV1 = {
      v: 1, id: "ord_private", userId: "user-a", status: "fulfilled", paymentMethod: "mock",
      currency: "BC", items: [], total: 720, createdAt: 1,
    };
    kv.values.set(commerceOrderKey(order.id), JSON.stringify(order));
    const request = new Request(`https://blackcrown.test/api/commerce/orders/${order.id}`, {
      headers: { cookie: await signedCookie("user-b") },
    });
    const response = await getOrder(context(request, kv, { id: order.id }));
    expect(response.status).toBe(404);
    expect(await json(response)).toMatchObject({ reason: "order_not_found" });
  });

  it("returns only bounded normalized entitlements for the signed current user", async () => {
    const oversized = Array.from({ length: 800 }, (_, index) => index % 2 ? "skin_aurora" : "unknown");
    kv.values.set(commerceEntitlementsKey("user-a"), JSON.stringify({ v: 1, userId: "user-a", itemIds: oversized, updatedAt: 2 }));
    expect(normalizeEntitlementItemIds("user-b", JSON.parse(kv.values.get(commerceEntitlementsKey("user-a"))!))).toEqual([]);
    const request = new Request("https://blackcrown.test/api/commerce/entitlements", {
      headers: { cookie: await signedCookie("user-a") },
    });
    const response = await entitlements(context(request, kv));
    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({ entitlements: { userId: "user-a", itemIds: ["skin_aurora"], source: "server" } });
  });
});
