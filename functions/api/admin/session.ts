// functions/api/admin/session.ts
import { Env, verifyAdmin } from "../_lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const ok = await verifyAdmin(request, env);
  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 401,
    headers: { "Content-Type": "application/json" },
  });
};
