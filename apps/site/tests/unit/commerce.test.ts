import { beforeEach, describe, expect, it } from "vitest";
import {
  commerceEntitlementsKey,
  commerceOrderIndexKey,
  commerceOrderKey,
  normalizeEntitlementItemIds,
  validateCommerceItems,
  type CommerceOrderV1,
  type EntitlementsV1,
} from "../../../../functions/api/_lib/commerce";
import { onRequestPost as checkout } from "../../../../functions/api/commerce/checkout";
import { onRequestGet as entitlements } from "../../../../functions/api/commerce/entitlements";
import { onRequestGet as getOrder } from "../../../../functions/api/commerce/orders/[id]";

class FakeKV {
  readonly values = new Map<string, string>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string) {
    this.values.set(key, value);
  }
}

function context(request: Request, kv: FakeKV, params: Record<string, string> = {}) {
  return { request, env: { BC_KV: kv }, params } as never;
}

function checkoutRequest(userId: string | null, key: string, items: unknown) {
  const headers = new Headers({
    "content-type": "application/json",
    "Idempotency-Key": key,
  });
  if (userId) headers.set("cookie", `bc_uid=${userId}`);
  return new Request("https://blackcrown.test/api/commerce/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify({ items, paymentMethod: "mock", idempotencyKey: key }),
  });
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, any>>;
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
  });

  it("normalizes duplicate lines", () => {
    const result = validateCommerceItems([
      { itemId: "skin_aurora", quantity: 2 },
      { itemId: "skin_aurora", quantity: 3 },
    ]);
    expect(result).toMatchObject({ ok: true, total: 3600 });
    if (result.ok) expect(result.items).toHaveLength(1);
  });
});

describe("checkout and ownership", () => {
  let kv: FakeKV;

  beforeEach(() => {
    kv = new FakeKV();
  });

  it("rejects an unauthenticated checkout", async () => {
    const response = await checkout(context(checkoutRequest(null, "checkout:key-1", [{ itemId: "skin_aurora", quantity: 1 }]), kv));
    expect(response.status).toBe(401);
    expect(await json(response)).toMatchObject({ reason: "auth_required" });
  });

  it("replays one order for a duplicate idempotency key and grants once", async () => {
    const firstResponse = await checkout(context(checkoutRequest("user-a", "checkout:key-2", [{ itemId: "skin_aurora", quantity: 1 }]), kv));
    const first = await json(firstResponse);
    const secondResponse = await checkout(context(checkoutRequest("user-a", "checkout:key-2", [{ itemId: "skin_aurora", quantity: 1 }]), kv));
    const second = await json(secondResponse);

    expect(first.order.id).toBe(second.order.id);
    expect(second.idempotentReplay).toBe(true);
    const owned = JSON.parse(kv.values.get(commerceEntitlementsKey("user-a")) || "{}") as EntitlementsV1;
    const orderIds = JSON.parse(kv.values.get(commerceOrderIndexKey("user-a")) || "[]") as string[];
    expect(owned.itemIds).toEqual(["skin_aurora"]);
    expect(orderIds).toEqual([first.order.id]);
  });

  it("does not expose a foreign order", async () => {
    const order: CommerceOrderV1 = {
      v: 1,
      id: "ord_private",
      userId: "user-a",
      status: "fulfilled",
      paymentMethod: "mock",
      currency: "BC",
      items: [],
      total: 720,
      createdAt: 1,
    };
    kv.values.set(commerceOrderKey(order.id), JSON.stringify(order));
    const request = new Request(`https://blackcrown.test/api/commerce/orders/${order.id}`, { headers: { cookie: "bc_uid=user-b" } });
    const response = await getOrder(context(request, kv, { id: order.id }));
    expect(response.status).toBe(404);
    expect(await json(response)).toMatchObject({ reason: "order_not_found" });
  });

  it("returns only normalized entitlements for the current user", async () => {
    kv.values.set(
      commerceEntitlementsKey("user-a"),
      JSON.stringify({ v: 1, userId: "user-a", itemIds: ["skin_aurora", "skin_aurora", "unknown"], updatedAt: 2 }),
    );
    expect(normalizeEntitlementItemIds("user-b", JSON.parse(kv.values.get(commerceEntitlementsKey("user-a"))!))).toEqual([]);

    const request = new Request("https://blackcrown.test/api/commerce/entitlements", { headers: { cookie: "bc_uid=user-a" } });
    const response = await entitlements(context(request, kv));
    expect(await json(response)).toMatchObject({ entitlements: { userId: "user-a", itemIds: ["skin_aurora"], source: "server" } });
  });
});
