// functions/api/metrics/ping.ts
import { Env, getMetricsKV } from "../_lib/auth";

type PingBody = { clientId?: string; app?: "site" | "lobby" | "game" };

function dayUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: true, kv: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: PingBody = {};
  try {
    body = (await request.json()) as PingBody;
  } catch {
    body = {};
  }

  const clientId = String(body.clientId || "").trim();
  const app = (body.app || "site") as "site" | "lobby" | "game";

  if (!clientId) {
    return new Response(JSON.stringify({ ok: false, reason: "missing_clientId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const d = dayUTC();

  // online TTL (2 minutes)
  await kv.put(`o:${app}:${clientId}`, String(Date.now()), { expirationTtl: 120 });

  // unique per UTC day (keep 3 days)
  await kv.put(`u:${d}:${app}:${clientId}`, "1", { expirationTtl: 3 * 24 * 60 * 60 });

  return new Response(JSON.stringify({ ok: true, kv: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
