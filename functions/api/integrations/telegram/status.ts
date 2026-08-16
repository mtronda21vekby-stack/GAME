import type { Env } from "../../_lib/auth";
import { callBlackCrownPublicRpc } from "../../_lib/blackcrown-supabase";
import { verifyUserSession } from "../../_lib/user-session";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "auth_required" }, 401);

  try {
    const rpc = await callBlackCrownPublicRpc(env, "blackcrown_get_site_telegram_status", {
      p_site_user_id: session.userId,
    });

    if (!rpc.ok || rpc.payload.ok !== true) {
      return json({ ok: false, reason: "link_service_unavailable" }, 503);
    }

    return json({
      ok: true,
      linked: rpc.payload.linked === true,
      premium: rpc.payload.premium === true,
      entitlements: Array.isArray(rpc.payload.entitlements) ? rpc.payload.entitlements : [],
      linkedAt: typeof rpc.payload.linked_at === "string" ? rpc.payload.linked_at : null,
    });
  } catch {
    return json({ ok: false, reason: "link_service_unavailable" }, 503);
  }
};
