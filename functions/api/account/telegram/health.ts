import type { Env } from "../../_lib/auth";
import {
  callSupabaseRpc,
  supabaseServerConfigured,
} from "../../_lib/supabase-server";

const RELEASE = "identity-bridge-v15";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const configured = supabaseServerConfigured(env);
  if (!configured) {
    return json({
      ok: false,
      release: RELEASE,
      configured: false,
      databaseReachable: false,
      reason: "identity_storage_unavailable",
    }, 503);
  }

  // This site_user_id is intentionally invalid for real account creation and
  // the status RPC is read-only. It produces no account, code, or event row.
  const result = await callSupabaseRpc<Array<Record<string, unknown>>>(
    env,
    "blackcrown_get_site_telegram_status",
    { p_site_user_id: "health-probe" },
    request.signal,
  );

  if (!result.ok) {
    return json({
      ok: false,
      release: RELEASE,
      configured: true,
      databaseReachable: false,
      reason: result.reason,
    }, 503);
  }

  return json({
    ok: true,
    release: RELEASE,
    configured: true,
    databaseReachable: true,
  });
};
