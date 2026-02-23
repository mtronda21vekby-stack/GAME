// functions/api/metrics/unique.ts
import { Env, getMetricsKV } from "../_lib/auth";

type Body = { app?: "site" | "lobby" | "game"; user?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function dayUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function safeUser(s: string) {
  return s
    .trim()
    .slice(0, 120)
    .replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
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

  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const user = safeUser(String(body.user || ip));

  const d = dayUTC();
  const key = `u:${d}:${app}:${user}`;

  // 1 раз в сутки: если ключ уже есть — не перезаписываем
  const existed = await kv.get(key);
  if (existed) return json({ ok: true, kv: true, isNew: false });

  // TTL 2 дня чтобы пережить границу суток и не раздувать KV
  await kv.put(key, "1", { expirationTtl: 2 * 24 * 60 * 60 });

  return json({ ok: true, kv: true, isNew: true });
};
