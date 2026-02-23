// functions/api/metrics/ping.ts
import type { Env } from "../_lib/auth";
import { trackPresence } from "./_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let id = "";
  let app = "site";
  try {
    const body = (await request.json()) as { id?: string; app?: string };
    id = String(body?.id || "").trim();
    app = String(body?.app || "site").trim();
  } catch {
    id = "";
  }

  if (!id || id.length < 6 || id.length > 128) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await trackPresence(env, app, id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
