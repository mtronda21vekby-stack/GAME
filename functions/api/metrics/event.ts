// functions/api/metrics/event.ts
import { Env, getMetricsKV } from "../_lib/auth";

type Body = { app?: "site" | "lobby" | "game"; name?: string; n?: number };

function hourUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${dd}-${hh}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function safeName(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-:.]/g, "_")
    .slice(0, 64);
}

// best-effort read-modify-write (KV eventually consistent, но для метрик ок)
async function kvAdd(kv: KVNamespace, key: string, add: number) {
  const curRaw = await kv.get(key);
  const cur = Number(curRaw || "0") || 0;
  const next = cur + add;
  await kv.put(key, String(next), { expirationTtl: 26 * 60 * 60 }); // keep 26h
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
  const name = safeName(String(body.name || ""));
  const n = Math.max(1, Math.min(10_000, Math.floor(Number(body.n || 1) || 1)));

  if (app !== "site" && app !== "lobby" && app !== "game") {
    return json({ ok: false, reason: "bad_app" }, 400);
  }
  if (!name) return json({ ok: false, reason: "missing_name" }, 400);

  const h = hourUTC();
  const key = `e:${h}:${app}:${name}`;

  await kvAdd(kv, key, n);

  return json({ ok: true, kv: true });
};
