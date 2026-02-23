// functions/api/metrics/_lib.ts
import type { Env } from "../_lib/auth";

type KVListResult = { keys?: { name: string }[]; list_complete?: boolean; cursor?: string };

const mem = {
  online: new Map<string, number>(), // id -> expMs
  daily: new Map<string, Set<string>>(), // dayKey -> set(ids)
};

function dayKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

function getKV(env: Env): any | null {
  const kv = (env as any)?.BC_METRICS_KV;
  return kv ?? null;
}

async function kvListAll(kv: any, prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined = undefined;

  for (let guard = 0; guard < 50; guard++) {
    const r = (await kv.list({ prefix, cursor })) as KVListResult;
    for (const k of r.keys || []) out.push(k.name);
    if (r.list_complete) break;
    cursor = r.cursor;
    if (!cursor) break;
  }

  return out;
}

export async function trackPresence(env: Env, id: string): Promise<void> {
  const kv = getKV(env);
  const now = Date.now();
  const exp = now + 120_000; // 2 min online window
  const day = dayKeyUTC();

  if (kv) {
    // online marker with TTL
    await kv.put(`p:${id}`, "1", { expirationTtl: 130 });

    // unique per day marker with TTL
    await kv.put(`d:${day}:${id}`, "1", { expirationTtl: 2 * 24 * 60 * 60 });
    return;
  }

  // fallback (unstable между инстансами)
  mem.online.set(id, exp);
  const set = mem.daily.get(day) || new Set<string>();
  set.add(id);
  mem.daily.set(day, set);
}

export async function getStats(env: Env): Promise<{ online: number; dayUnique: number; kv: boolean }> {
  const kv = getKV(env);
  const day = dayKeyUTC();

  if (kv) {
    const onlineKeys = await kvListAll(kv, "p:");
    const dayKeys = await kvListAll(kv, `d:${day}:`);
    return { online: onlineKeys.length, dayUnique: dayKeys.length, kv: true };
  }

  // fallback
  const now = Date.now();
  let online = 0;
  for (const [, exp] of mem.online.entries()) {
    if (exp > now) online++;
  }
  const set = mem.daily.get(day) || new Set<string>();
  return { online, dayUnique: set.size, kv: false };
}
