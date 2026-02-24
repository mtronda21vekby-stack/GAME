import { Env, getMetricsKV } from "../_lib/auth";
import { getOrSetUserId } from "../_lib/user";

type Body = { event?: string };

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(extraHeaders || {}),
    },
  });
}

function safeEvent(s: string) {
  return String(s || "")
    .trim()
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9_\-:.]/g, "_");
}

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(v)));
}

/**
 * Server-authoritative XP table (MVP).
 * Если event не в allowlist — ничего не начисляем.
 * Cooldown enforced in KV via ttl.
 */
const XP_TABLE: Record<string, { add: number; cdSec: number }> = {
  visit_account: { add: 12, cdSec: 12 * 60 * 60 },
  save_profile: { add: 18, cdSec: 10 * 60 },
  save_prefs: { add: 10, cdSec: 7 * 60 },
  equip_skin: { add: 6, cdSec: 5 * 60 },
  equip_badge: { add: 6, cdSec: 5 * 60 },
  pick_avatar: { add: 6, cdSec: 10 * 60 },
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: true, kv: false, xp: 0 });

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const event = safeEvent(String(body.event || ""));
  const rule = XP_TABLE[event];
  if (!rule) return json({ ok: true, kv: true, xp: null, applied: false, reason: "unknown_event" });

  const { uid, setCookieHeader } = getOrSetUserId(request, env);

  // Cooldown gate
  const cdKey = `xp_cd:v1:${uid}:${event}`;
  const cd = await kv.get(cdKey);
  if (cd) {
    const headers: Record<string, string> = {};
    if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;
    return json({ ok: true, kv: true, applied: false, cooldown: true }, 200, headers);
  }

  // Read current XP
  const xpKey = `xp:v1:${uid}`;
  const raw = await kv.get(xpKey);
  const curN = Number(raw || "0");
  const cur = Number.isFinite(curN) ? clampInt(curN, 0, 2_000_000_000) : 0;

  const next = clampInt(cur + rule.add, 0, 2_000_000_000);

  await Promise.all([
    kv.put(xpKey, String(next)),
    kv.put(cdKey, "1", { expirationTtl: Math.max(30, Math.floor(rule.cdSec)) }),
  ]);

  const headers: Record<string, string> = {};
  if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

  return json({ ok: true, kv: true, applied: true, xp: next, add: rule.add, event }, 200, headers);
};
