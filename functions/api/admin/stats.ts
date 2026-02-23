// functions/api/admin/stats.ts
import { Env, verifyAdmin } from "../_lib/auth";
import { presenceStats } from "../_lib/presence";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const ok = await verifyAdmin(request, env);
  if (!ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, ...presenceStats() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
