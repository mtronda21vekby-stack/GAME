import type { Env } from "../../_lib/auth";
import { callBlackCrownBotBridge } from "../../_lib/blackcrown-bot-bridge";
import { completeTelegramLink } from "../../_lib/blackcrown-supabase-bridge";
import { recoverGuestUserId, setUserSessionCookie, verifyUserSession } from "../../_lib/user-session";

const MAX_BODY_BYTES = 2_048;
const USER_TTL = 180 * 24 * 60 * 60;

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(headers || {}) },
  });
}

function safeCode(value: unknown) {
  const code = String(value ?? "").trim();
  if (code.length < 32 || code.length > 128) return "";
  return /^[A-Za-z0-9_-]+$/.test(code) ? code : "";
}

function resultStatus(reason: string) {
  if (reason === "site_already_linked" || reason === "telegram_already_linked" || reason === "link_conflict") return 409;
  if (reason === "invalid_or_expired_code" || reason === "invalid_site_user") return 400;
  if (reason === "auth_required" || reason === "site_session_mismatch") return 401;
  return 503;
}

function publicResult(payload: Record<string, unknown>) {
  return {
    ok: true,
    linked: payload.linked === true,
    premium: payload.premium === true,
    entitlements: Array.isArray(payload.entitlements) ? payload.entitlements : [],
    linkedAt: typeof payload.linkedAt === "string" ? payload.linkedAt : typeof payload.linked_at === "string" ? payload.linked_at : null,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return json({ ok: false, reason: "payload_too_large" }, 413);

  let body: { code?: unknown; clientId?: unknown } = {};
  try { body = (await request.json()) as { code?: unknown; clientId?: unknown }; }
  catch { return json({ ok: false, reason: "invalid_json" }, 400); }

  const code = safeCode(body.code);
  if (!code) return json({ ok: false, reason: "invalid_or_expired_code" }, 400);

  // Normal path: signed HttpOnly session. Recovery path: the same high-entropy
  // client credential used by /api/auth/guest. This avoids iOS/Telegram WebView
  // Set-Cookie races between guest bootstrap and the immediately following link
  // request while preserving a stable site identity.
  const session = await verifyUserSession(request, env);
  const recoveredUserId = session?.userId ? null : await recoverGuestUserId(body.clientId);
  const siteUserId = session?.userId || recoveredUserId;
  if (!siteUserId) return json({ ok: false, reason: "auth_required" }, 401);

  const direct = await completeTelegramLink(env, code, siteUserId);
  if (direct.ok && direct.payload.ok === true) {
    const cookie = recoveredUserId ? await setUserSessionCookie(env, siteUserId, USER_TTL) : null;
    return json(publicResult(direct.payload), 200, cookie ? { "Set-Cookie": cookie } : undefined);
  }
  const directReason = String(direct.payload.reason || "");
  if (directReason && !["supabase_bridge_unconfigured", "supabase_bridge_unavailable"].includes(directReason)) {
    return json({ ok: false, reason: directReason }, resultStatus(directReason));
  }

  try {
    const bridge = await callBlackCrownBotBridge(request, env, "link", siteUserId, { code });
    if (!bridge.ok || bridge.payload.ok !== true) {
      const reason = String(bridge.payload.reason || directReason || "link_service_unavailable");
      return json({ ok: false, reason }, resultStatus(reason));
    }
    const cookie = recoveredUserId ? await setUserSessionCookie(env, siteUserId, USER_TTL) : null;
    return json(publicResult(bridge.payload), 200, cookie ? { "Set-Cookie": cookie } : undefined);
  } catch {
    return json({ ok: false, reason: directReason || "link_service_unavailable" }, 503);
  }
};
