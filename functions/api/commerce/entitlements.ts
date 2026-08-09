import { getMetricsKV, getUserIdCookie, type Env } from "../_lib/auth";
import {
  commerceEntitlementsKey,
  commerceJson,
  normalizeEntitlementItemIds,
  readCommerceJson,
  type EntitlementsV1,
} from "../_lib/commerce";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return commerceJson({ ok: false, reason: "commerce_storage_unavailable" }, 503);

  const userId = getUserIdCookie(request)?.trim();
  if (!userId) return commerceJson({ ok: false, reason: "auth_required" }, 401);

  const stored = await readCommerceJson<EntitlementsV1>(kv, commerceEntitlementsKey(userId));
  const itemIds = normalizeEntitlementItemIds(userId, stored);

  return commerceJson({
    ok: true,
    entitlements: {
      userId,
      itemIds,
      updatedAt: stored?.updatedAt ?? null,
      source: "server",
    },
  });
};
