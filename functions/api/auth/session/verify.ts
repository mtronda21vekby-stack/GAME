import type { Env } from "../../_lib/auth";
import { verifyUserSession } from "../../_lib/user-session";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "unauthorized" }, 401);

  return json({
    ok: true,
    userId: session.userId,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
  });
};
