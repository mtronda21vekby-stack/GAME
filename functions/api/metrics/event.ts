// functions/api/metrics/event.ts
import type { Env } from "../_lib/auth";
import { incEvent } from "./_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let app = "site";
  let name = "";
  let n = 1;

  try {
    const body = (await request.json()) as { app?: string; name?: string; n?: number };
    app = String(body?.app || "site").trim();
    name = String(body?.name || "").trim();
    n = typeof body?.n === "number" ? body.n : 1;
  } catch {
    // ignore
  }

  if (!name || name.length < 2 || name.length > 64) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await incEvent(env, app, name, n);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
