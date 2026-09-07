import type { Env } from "../../_lib/auth";
import { callSupabaseRpc } from "../../_lib/supabase-server";
import { verifyUserSession } from "../../_lib/user-session";

type StatusRow = {
  linked?: unknown;
  telegram_username?: unknown;
  linked_at?: unknown;
  premium_active?: unknown;
  entitlement_keys?: unknown;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizeKeys(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => /^[a-z0-9._-]{1,80}$/.test(entry))))
    .slice(0, 100);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "auth_required" }, 401);

  const result = await callSupabaseRpc<StatusRow[]>(
    env,
    "blackcrown_get_site_telegram_status",
    { p_site_user_id: session.userId },
    request.signal,
  );
  if (!result.ok) return json({ ok: false, reason: result.reason }, result.status);

  const row = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : {};
  const username = typeof row.telegram_username === "string" && /^[A-Za-z0-9_]{1,64}$/.test(row.telegram_username)
    ? row.telegram_username
    : null;
  const linkedAt = typeof row.linked_at === "string" ? row.linked_at : null;
  const entitlementKeys = normalizeKeys(row.entitlement_keys);

  return json({
    ok: true,
    linked: row.linked === true,
    telegramUsername: username,
    linkedAt,
    premiumActive: row.premium_active === true,
    entitlementKeys,
  });
};
