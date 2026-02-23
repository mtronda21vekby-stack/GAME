// functions/api/metrics/stats.ts
import type { Env } from "../_lib/auth";
import { verifyAdmin } from "../_lib/auth";
import { getEvents24h, getStats } from "./_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const ok = await verifyAdmin(request, env);
  if (!ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const s = await getStats(env);
  const e = await getEvents24h(env);

  return new Response(
    JSON.stringify({
      ok: true,
      stats: s,
      events24h: e,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
