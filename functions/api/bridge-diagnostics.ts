import type { Env } from "./_lib/auth";

const DEFAULT_SUPABASE_URL = "https://wqriwhciqvrbhkkiuhxb.supabase.co";
const CONTRACT = "blackcrown-account-bridge-v43-direct-supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const key = String(
    env.SUPABASE_SERVICE_ROLE_KEY ||
      env.BLACKCROWN_SUPABASE_SERVICE_ROLE_KEY ||
      env.SUPABASE_SERVICE_KEY ||
      "",
  ).trim();
  const url = String(env.SUPABASE_URL || env.BLACKCROWN_SUPABASE_URL || DEFAULT_SUPABASE_URL)
    .trim()
    .replace(/\/$/, "");

  if (!key) {
    return json({
      ok: false,
      contract: CONTRACT,
      cloudflareSecretVisible: false,
      supabaseReachable: false,
      reason: "supabase_service_role_missing",
    }, 503);
  }

  try {
    const response = await fetch(`${url}/rest/v1/rpc/blackcrown_get_site_telegram_status`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        accept: "application/json",
        "content-type": "application/json",
        "cache-control": "no-store",
        "user-agent": "BlackCrown-Pages/bridge-diagnostics-v43",
      },
      body: JSON.stringify({ p_site_user_id: "__diagnostic__" }),
    });

    let payload: Record<string, unknown> = {};
    try {
      const raw = await response.json();
      if (raw && typeof raw === "object" && !Array.isArray(raw)) payload = raw as Record<string, unknown>;
    } catch {
      payload = {};
    }

    const rpcContractOk = response.ok && payload.ok === true;
    return json({
      ok: rpcContractOk,
      contract: CONTRACT,
      cloudflareSecretVisible: true,
      supabaseReachable: response.ok,
      rpcContractOk,
      rpcStatus: response.status,
      rpcReason: typeof payload.reason === "string" ? payload.reason : null,
    }, rpcContractOk ? 200 : 503);
  } catch {
    return json({
      ok: false,
      contract: CONTRACT,
      cloudflareSecretVisible: true,
      supabaseReachable: false,
      reason: "supabase_request_failed",
    }, 503);
  }
};
