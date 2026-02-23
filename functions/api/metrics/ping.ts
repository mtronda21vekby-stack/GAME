// functions/api/metrics/ping.ts
import { Env, getMetricsKV } from "../_lib/auth";

type PingBody = { clientId?: string; area?: string };

function dayUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: false, kv: false }), {
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
  if (!clientId) {
    return new Response(JSON.stringify({ ok: false, reason: "missing_clientId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Online: keep alive key with TTL (2 min)
  const onlineKey = `o:${clientId}`;
  await kv.put(onlineKey, String(Date.now()), { expirationTtl: 120 });

  // Unique per UTC day (store as set via keys)
  const d = dayUTC();
  const uniqKey = `u:${d}:${clientId}`;
  await kv.put(uniqKey, "1", { expirationTtl: 3 * 24 * 60 * 60 }); // keep 3 days

  return new Response(JSON.stringify({ ok: true, kv: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
