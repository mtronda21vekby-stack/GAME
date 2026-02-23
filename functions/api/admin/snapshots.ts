// functions/api/admin/snapshots.ts
import { Env, getMetricsKV, verifyAdminToken } from "../_lib/auth";

async function listIds(kv: KVNamespace, prefix: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined = undefined;

  for (let i = 0; i < 25; i++) {
    const res = await kv.list({ prefix, cursor, limit: 1000 });
    cursor = res.cursor;

    for (const k of res.keys || []) {
      const name = k.name;
      if (name.startsWith(prefix)) ids.push(name.slice(prefix.length));
    }
    if (!cursor) break;
  }

  // newest first if ids are time-based
  ids.sort().reverse();
  return ids.slice(0, 200);
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const claims = await verifyAdminToken(request, env);
  if (!claims) {
    return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: true, ids: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim();

  const prefix = "s:";
  if (!id) {
    const ids = await listIds(kv, prefix);
    return new Response(JSON.stringify({ ok: true, ids }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const raw = await kv.get(`${prefix}${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ ok: false, id }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  let payload: any = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = raw;
  }

  return new Response(JSON.stringify({ ok: true, id, payload }), { status: 200, headers: { "Content-Type": "application/json" } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const claims = await verifyAdminToken(request, env);
  if (!claims) {
    return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: false, reason: "kv_off" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const id = `${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  await kv.put(`s:${id}`, JSON.stringify(payload ?? null), { expirationTtl: 30 * 24 * 60 * 60 }); // 30 days

  return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { "Content-Type": "application/json" } });
};
