import type { Page, Route } from "@playwright/test";
import { COMMERCE_CATALOG_BY_ID } from "@blackcrown/commerce";

type TestLine = { itemId: string; quantity: number };
type TestOrder = {
  id: string;
  userId: string;
  status: "fulfilled";
  paymentMethod: "mock";
  currency: "BC";
  items: Array<TestLine & { title: string; unitPrice: number; lineTotal: number }>;
  total: number;
  createdAt: number;
  fulfilledAt: number;
};

export type ApiAdapterOptions = {
  entitlements?: string[];
  entitlementsError?: boolean;
  orders?: TestOrder[];
};

export type ApiAdapterState = {
  checkoutKeys: string[];
  orders: Map<string, TestOrder>;
  entitlements: Set<string>;
};

function response(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  });
}

function validateLines(lines: TestLine[]) {
  const normalized = new Map<string, number>();
  for (const line of lines) {
    const item = COMMERCE_CATALOG_BY_ID.get(line.itemId);
    if (!item || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10) return null;
    normalized.set(line.itemId, (normalized.get(line.itemId) ?? 0) + line.quantity);
  }
  const items = Array.from(normalized, ([itemId, quantity]) => {
    const item = COMMERCE_CATALOG_BY_ID.get(itemId)!;
    return { itemId, quantity, title: item.title, unitPrice: item.price, lineTotal: item.price * quantity };
  });
  return { items, total: items.reduce((sum, item) => sum + item.lineTotal, 0) };
}

export async function installApiAdapter(page: Page, options: ApiAdapterOptions = {}): Promise<ApiAdapterState> {
  const state: ApiAdapterState = {
    checkoutKeys: [],
    orders: new Map((options.orders ?? []).map((order) => [order.id, order])),
    entitlements: new Set(options.entitlements ?? []),
  };
  const idempotency = new Map<string, string>();

  await page.route("**/rest/v1/blackcrown_world_status**", (route) =>
    response(route, 200, [
      { slug: "evofish", display_name: "EvoFish", status: "LIVE", tone: "cyan", summary: "Online", sort_order: 10, updated_at: "" },
      { slug: "crown-front", display_name: "CROWN//FRONT", status: "ALPHA", tone: "orange", summary: "Alpha", sort_order: 20, updated_at: "" },
      { slug: "blackcrown-network", display_name: "Network", status: "LIVE", tone: "green", summary: "Online", sort_order: 30, updated_at: "" },
    ]),
  );

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/auth/guest") {
      return response(route, 200, { ok: true, userId: "e2e-user", profile: { id: "e2e-user" } });
    }

    if (url.pathname === "/api/commerce/entitlements") {
      if (options.entitlementsError) return response(route, 503, { ok: false, reason: "commerce_storage_unavailable" });
      return response(route, 200, {
        ok: true,
        entitlements: { userId: "e2e-user", itemIds: [...state.entitlements], updatedAt: Date.now(), source: "server" },
      });
    }

    if (url.pathname === "/api/commerce/quote") {
      const body = request.postDataJSON() as { items: TestLine[] };
      const quote = validateLines(body.items);
      return quote
        ? response(route, 200, { ok: true, quoteId: "quote-e2e", currency: "BC", ...quote })
        : response(route, 400, { ok: false, reason: "invalid_cart" });
    }

    if (url.pathname === "/api/commerce/checkout") {
      const body = request.postDataJSON() as { items: TestLine[]; idempotencyKey: string };
      const key = request.headers()["idempotency-key"] || body.idempotencyKey;
      state.checkoutKeys.push(key);
      const previousOrderId = idempotency.get(key);
      if (previousOrderId) return response(route, 200, { ok: true, order: state.orders.get(previousOrderId), idempotentReplay: true });

      const quote = validateLines(body.items);
      if (!quote) return response(route, 400, { ok: false, reason: "invalid_cart" });
      const orderId = `ord-e2e-${state.orders.size + 1}`;
      const now = Date.now();
      const order: TestOrder = {
        id: orderId,
        userId: "e2e-user",
        status: "fulfilled",
        paymentMethod: "mock",
        currency: "BC",
        items: quote.items,
        total: quote.total,
        createdAt: now,
        fulfilledAt: now,
      };
      state.orders.set(orderId, order);
      idempotency.set(key, orderId);
      for (const item of order.items) state.entitlements.add(item.itemId);
      return response(route, 200, { ok: true, order, idempotentReplay: false });
    }

    if (url.pathname.startsWith("/api/commerce/orders/")) {
      const orderId = decodeURIComponent(url.pathname.slice("/api/commerce/orders/".length));
      const order = state.orders.get(orderId);
      return order ? response(route, 200, { ok: true, order }) : response(route, 404, { ok: false, reason: "order_not_found" });
    }

    return response(route, 404, { ok: false, reason: "not_found" });
  });

  return state;
}

export function makeOrder(id = "ord-valid"): TestOrder {
  const item = COMMERCE_CATALOG_BY_ID.get("skin_aurora")!;
  const now = Date.now();
  return {
    id,
    userId: "e2e-user",
    status: "fulfilled",
    paymentMethod: "mock",
    currency: "BC",
    items: [{ itemId: item.id, title: item.title, quantity: 1, unitPrice: item.price, lineTotal: item.price }],
    total: item.price,
    createdAt: now,
    fulfilledAt: now,
  };
}
