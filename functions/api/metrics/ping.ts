// functions/api/metrics/ping.ts
import { Env, getMetricsKV } from "../_lib/auth";

type Body = {
  clientId?: string;
  area?: "site" | "lobby" | "game";
  ttl?: number;
};

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

function safeId(s: string) {
  return s
    .trim()
    .slice(0, 160)
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

  const area = (body.area || "site") as "site" | "lobby" | "game";
  if (area !== "site" && area !== "lobby" && area !== "game") {
    return json({ ok: false, reason: "bad_area" }, 400);
  }

  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const clientId = safeId(String(body.clientId || ip));
  const ttl = clampInt(body.ttl, 30, 600, 90);

  // ONLINE
  await kv.put(`o:${area}:${clientId}`, "1", { expirationTtl: ttl });

  // UNIQUE (UTC day)
  const d = dayUTC();
  const uniqKey = `u:${d}:${area}:${clientId}`;
  const existed = await kv.get(uniqKey);
  if (!existed) {
    await kv.put(uniqKey, "1", { expirationTtl: 2 * 24 * 60 * 60 });
  }

  return json({ ok: true, kv: true, area, ttl, uniqueNew: !existed });
};
