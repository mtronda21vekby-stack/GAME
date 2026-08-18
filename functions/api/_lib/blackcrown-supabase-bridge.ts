import type { Env } from "./auth";

const DEFAULT_SUPABASE_URL = "https://wqriwhciqvrbhkkiuhxb.supabase.co";
const REQUEST_TIMEOUT_MS = 12_000;

function config(env: Env) {
  const url = String(env.SUPABASE_URL || env.BLACKCROWN_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, "");
  const key = String(
    env.SUPABASE_SERVICE_ROLE_KEY ||
      env.BLACKCROWN_SUPABASE_SERVICE_ROLE_KEY ||
      env.SUPABASE_SERVICE_KEY ||
      "",
  ).trim();
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(url) || !key) return null;
  return { url, key };
}

async function rpc(env: Env, name: string, args: Record<string, unknown>) {
  const cfg = config(env);
  if (!cfg) return { ok: false, status: 503, payload: { ok: false, reason: "supabase_bridge_unconfigured" } };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${cfg.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        authorization: `Bearer ${cfg.key}`,
        accept: "application/json",
        "content-type": "application/json",
        "cache-control": "no-store",
        "user-agent": "BlackCrown-Pages/direct-account-bridge-v1",
      },
      body: JSON.stringify(args),
      signal: controller.signal,
    });
    let payload: Record<string, unknown> = {};
    try {
      const raw = await response.json();
      if (raw && typeof raw === "object" && !Array.isArray(raw)) payload = raw as Record<string, unknown>;
    } catch {
      payload = {};
    }
    return { ok: response.ok && payload.ok === true, status: response.status, payload };
  } catch {
    return { ok: false, status: 503, payload: { ok: false, reason: "supabase_bridge_unavailable" } };
  } finally {
    clearTimeout(timer);
  }
}

export function completeTelegramLink(env: Env, code: string, siteUserId: string) {
  return rpc(env, "blackcrown_complete_telegram_link", { p_code: code, p_site_user_id: siteUserId });
}

export function getTelegramLinkStatus(env: Env, siteUserId: string) {
  return rpc(env, "blackcrown_get_site_telegram_status", { p_site_user_id: siteUserId });
}
