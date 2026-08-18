import type { Env } from "../../_lib/auth";
import { callBlackCrownBotBridge } from "../../_lib/blackcrown-bot-bridge";
import { getTelegramLinkStatus } from "../../_lib/blackcrown-supabase-bridge";
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

function publicResult(payload: Record<string, unknown>) {
  return {
    ok: true,
    linked: payload.linked === true,
    premium: payload.premium === true,
    entitlements: Array.isArray(payload.entitlements) ? payload.entitlements : [],
    linkedAt:
      typeof payload.linkedAt === "string"
        ? payload.linkedAt
        : typeof payload.linked_at === "string"
          ? payload.linked_at
          : null,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "auth_required" }, 401);

  const direct = await getTelegramLinkStatus(env, session.userId);
  if (direct.ok && direct.payload.ok === true) return json(publicResult(direct.payload));
  const directReason = String(direct.payload.reason || "");
  if (directReason && !["supabase_bridge_unconfigured", "supabase_bridge_unavailable"].includes(directReason)) {
    return json({ ok: false, reason: directReason }, directReason === "invalid_site_user" ? 400 : 503);
  }

  try {
    const bridge = await callBlackCrownBotBridge(request, env, "status", session.userId);
    if (!bridge.ok || bridge.payload.ok !== true) {
      const reason = String(bridge.payload.reason || directReason || "link_service_unavailable");
      return json({ ok: false, reason }, reason === "auth_required" || reason === "site_session_mismatch" ? 401 : 503);
    }
    return json(publicResult(bridge.payload));
  } catch {
    return json({ ok: false, reason: directReason || "link_service_unavailable" }, 503);
  }
};
