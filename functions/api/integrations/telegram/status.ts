import type { Env } from "../../_lib/auth";
import { callBlackCrownBotBridge } from "../../_lib/blackcrown-bot-bridge";
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
    const bridge = await callBlackCrownBotBridge(request, env, "status", session.userId);
    if (!bridge.ok || bridge.payload.ok !== true) {
      const reason = String(bridge.payload.reason || "link_service_unavailable");
      return json({ ok: false, reason }, reason === "auth_required" || reason === "site_session_mismatch" ? 401 : 503);
    }

    return json({
      ok: true,
      linked: bridge.payload.linked === true,
      premium: bridge.payload.premium === true,
      entitlements: Array.isArray(bridge.payload.entitlements) ? bridge.payload.entitlements : [],
      linkedAt: typeof bridge.payload.linkedAt === "string" ? bridge.payload.linkedAt : null,
    });
  } catch {
    return json({ ok: false, reason: "link_service_unavailable" }, 503);
  }
};
