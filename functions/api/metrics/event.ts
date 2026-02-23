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

function safeName(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-:.]/g, "_")
    .slice(0, 64);
}

async function kvAdd(kv: KVNamespace, key: string, add: number) {
  // best-effort read-modify-write
  for (let i = 0; i < 3; i++) {
    const curRaw = await kv.get(key);
    const cur = Number(curRaw || "0") || 0;
    const next = cur + add;
    await kv.put(key, String(next), { expirationTtl: 26 * 60 * 60 }); // keep 26h
    return;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: true, kv: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const app = (body.app || "site") as "site" | "lobby" | "game";
  const name = safeName(String(body.name || ""));
  const n = Math.max(1, Math.min(10_000, Math.floor(Number(body.n || 1) || 1)));

  if (!name) {
    return new Response(JSON.stringify({ ok: false, reason: "missing_name" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const h = hourUTC();
  const key = `e:${h}:${app}:${name}`;

  await kvAdd(kv, key, n);

  return new Response(JSON.stringify({ ok: true, kv: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
