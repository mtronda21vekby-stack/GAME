// functions/api/metrics/heartbeat.ts
import { Env, getMetricsKV } from "../_lib/auth";

type Body = { app?: "site" | "lobby" | "game"; user?: string; ttl?: number };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function safeUser(s: string) {
  return s
    .trim()
    .slice(0, 120)
    .replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
}

function clampInt(v: unknown, min: number, max: number, def: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: true, kv: false });

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const app = (body.app || "site") as "site" | "lobby" | "game";
  if (app !== "site" && app !== "lobby" && app !== "game") return json({ ok: false, reason: "bad_app" }, 400);

  // user обязателен; если не пришёл — используем ip как fallback (но лучше client id)
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const user = safeUser(String(body.user || ip));
  const ttl = clampInt(body.ttl, 30, 600, 90);

  const key = `o:${app}:${user}`;
  await kv.put(key, "1", { expirationTtl: ttl });

  return json({ ok: true, kv: true, ttl });
};
