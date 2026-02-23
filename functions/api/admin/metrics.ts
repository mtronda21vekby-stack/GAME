// functions/api/admin/metrics.ts
import { Env, getMetricsKV, verifyAdminToken } from "../_lib/auth";

function dayUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function countKeys(kv: KVNamespace, prefix: string): Promise<number> {
  // Cloudflare KV list is paginated; we’ll iterate safely
  let cursor: string | undefined = undefined;
  let total = 0;

  for (let i = 0; i < 25; i++) {
    const res = await kv.list({ prefix, cursor, limit: 1000 });
    total += res.keys?.length || 0;
    cursor = res.cursor;
    if (!cursor) break;
  }
  return total;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const claims = await verifyAdminToken(request, env);
  if (!claims) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: true, kv: false, online: 0, uniqueUtcDay: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const d = dayUTC();
  const [online, uniqueUtcDay] = await Promise.all([countKeys(kv, "o:"), countKeys(kv, `u:${d}:`)]);

  return new Response(JSON.stringify({ ok: true, kv: true, online, uniqueUtcDay, dayUtc: d }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
