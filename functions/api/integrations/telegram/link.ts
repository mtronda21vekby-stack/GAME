import type { Env } from "../../_lib/auth";
import { callBlackCrownPublicRpc } from "../../_lib/blackcrown-supabase";
import { verifyUserSession } from "../../_lib/user-session";

const MAX_BODY_BYTES = 2_048;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function safeCode(value: unknown) {
  const code = String(value ?? "").trim();
  if (code.length < 32 || code.length > 128) return "";
  return /^[A-Za-z0-9_-]+$/.test(code) ? code : "";
}

function resultStatus(reason: string) {
  if (reason === "site_already_linked" || reason === "telegram_already_linked" || reason === "link_conflict") {
    return 409;
  }
  if (reason === "invalid_or_expired_code" || reason === "invalid_site_user") return 400;
  return 502;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "auth_required" }, 401);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, reason: "payload_too_large" }, 413);
  }

  let body: { code?: unknown } = {};
  try {
    body = (await request.json()) as { code?: unknown };
  } catch {
    return json({ ok: false, reason: "invalid_json" }, 400);
  }

  const code = safeCode(body.code);
  if (!code) return json({ ok: false, reason: "invalid_or_expired_code" }, 400);

  try {
    const rpc = await callBlackCrownPublicRpc(env, "blackcrown_complete_telegram_link", {
      p_code: code,
      p_site_user_id: session.userId,
    });

    if (!rpc.ok) return json({ ok: false, reason: "link_service_unavailable" }, 503);
    if (rpc.payload.ok !== true) {
      const reason = String(rpc.payload.reason || "link_failed");
      return json({ ok: false, reason }, resultStatus(reason));
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
