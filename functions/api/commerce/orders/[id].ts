import { getMetricsKV, getUserIdCookie, type Env } from "../../_lib/auth";
import { commerceJson, commerceOrderKey, safeCommerceOrderId, type CommerceOrderV1 } from "../../_lib/commerce";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const kv = getMetricsKV(env);
  if (!kv) return commerceJson({ ok: false, reason: "commerce_storage_unavailable" }, 503);

  const userId = getUserIdCookie(request)?.trim();
  if (!userId) return commerceJson({ ok: false, reason: "auth_required" }, 401);

  const orderId = safeCommerceOrderId(params.id);
  if (!orderId) return commerceJson({ ok: false, reason: "invalid_order_id" }, 400);

  const raw = await kv.get(commerceOrderKey(orderId));
  if (!raw) return commerceJson({ ok: false, reason: "order_not_found" }, 404);

  let order: CommerceOrderV1 | null = null;
  try {
    order = JSON.parse(raw) as CommerceOrderV1;
  } catch {
    return commerceJson({ ok: false, reason: "order_corrupt" }, 500);
  }

  if (!order || order.userId !== userId) {
    return commerceJson({ ok: false, reason: "order_not_found" }, 404);
  }

  return commerceJson({ ok: true, order });
};
