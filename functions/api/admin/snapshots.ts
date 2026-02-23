// functions/api/admin/snapshots.ts
import type { Env } from "../_lib/auth";
import { verifyAdmin } from "../_lib/auth";
import { listSnapshots, loadSnapshot, saveSnapshot } from "../metrics/_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const ok = await verifyAdmin(request, env);
  if (!ok) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const r = await loadSnapshot(env, id);
    return new Response(JSON.stringify({ ok: r.ok, id, payload: r.payload ?? null }), {
      status: r.ok ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const r = await listSnapshots(env);
  return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ok = await verifyAdmin(request, env);
  if (!ok) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const r = await saveSnapshot(env, payload);
  return new Response(JSON.stringify(r), { status: r.ok ? 200 : 503, headers: { "Content-Type": "application/json" } });
};
