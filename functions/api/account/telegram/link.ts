import type { Env } from "../../_lib/auth";
import { callSupabaseRpc } from "../../_lib/supabase-server";
import { verifyUserSession } from "../../_lib/user-session";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "auth_required" }, 401);

  const result = await callSupabaseRpc<boolean>(
    env,
    "blackcrown_unlink_site_telegram",
    { p_site_user_id: session.userId },
    request.signal,
  );
  if (!result.ok) return json({ ok: false, reason: result.reason }, result.status);

  return json({ ok: true, unlinked: result.data === true });
};
