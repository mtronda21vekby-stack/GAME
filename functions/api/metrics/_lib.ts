// functions/api/metrics/_lib.ts
import type { Env } from "../_lib/auth";

type KVListResult = { keys?: { name: string }[]; list_complete?: boolean; cursor?: string };

const APPS = ["site", "lobby", "game"] as const;
export type AppKind = (typeof APPS)[number];

function dayKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

function hourKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${y}${m}${dd}${hh}`;
}

function getKV(env: Env): any | null {
  // Binding name must be BC_METRICS_KV
  const kv = (env as any)?.BC_METRICS_KV;
  return kv ?? null;
}

async function kvListAll(kv: any, prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined = undefined;

  for (let guard = 0; guard < 80; guard++) {
    const r = (await kv.list({ prefix, cursor })) as KVListResult;
    for (const k of r.keys || []) out.push(k.name);
    if (r.list_complete) break;
    cursor = r.cursor;
    if (!cursor) break;
  }

  return out;
}

function normApp(app: string): AppKind {
  const a = String(app || "").toLowerCase().trim();
  if (a === "site" || a === "lobby" || a === "game") return a;
  return "site";
}

function clampStr(s: string, max: number) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export async function trackPresence(env: Env, app: string, id: string): Promise<void> {
  const kv = getKV(env);
  if (!kv) return;

  const a = normApp(app);
  const safeId = clampStr(id, 128);
  const day = dayKeyUTC();

  // Online marker: TTL 130s, window about 2 minutes
  await kv.put(`p:${a}:${safeId}`, "1", { expirationTtl: 130 });

  // Unique per day: TTL 2 days
  await kv.put(`d:${a}:${day}:${safeId}`, "1", { expirationTtl: 2 * 24 * 60 * 60 });
}

export async function incEvent(env: Env, app: string, name: string, n = 1): Promise<void> {
  const kv = getKV(env);
  if (!kv) return;

  const a = normApp(app);
  const ev = clampStr(name, 64).toLowerCase();
  if (!ev) return;

  const hh = hourKeyUTC();
  const key = `e:${a}:${hh}:${ev}`;

  const curRaw = await kv.get(key);
  const cur = Number(curRaw || "0");
  const next = Number.isFinite(cur) ? cur + Math.max(1, Math.floor(n)) : Math.max(1, Math.floor(n));

  // keep 3 days
  await kv.put(key, String(next), { expirationTtl: 3 * 24 * 60 * 60 });
}

export async function getStats(env: Env): Promise<{
  kv: boolean;
  online: Record<AppKind, number>;
  uniqueDay: Record<AppKind, number>;
  onlineTotal: number;
  uniqueDayTotal: number;
}> {
  const kv = getKV(env);
  const day = dayKeyUTC();

  const online: Record<AppKind, number> = { site: 0, lobby: 0, game: 0 };
  const uniqueDay: Record<AppKind, number> = { site: 0, lobby: 0, game: 0 };

  if (!kv) {
    return { kv: false, online, uniqueDay, onlineTotal: 0, uniqueDayTotal: 0 };
  }

  for (const a of APPS) {
    const pKeys = await kvListAll(kv, `p:${a}:`);
    const dKeys = await kvListAll(kv, `d:${a}:${day}:`);
    online[a] = pKeys.length;
    uniqueDay[a] = dKeys.length;
  }

  const onlineTotal = online.site + online.lobby + online.game;
  const uniqueDayTotal = uniqueDay.site + uniqueDay.lobby + uniqueDay.game;

  return { kv: true, online, uniqueDay, onlineTotal, uniqueDayTotal };
}

export async function getEvents24h(env: Env): Promise<{
  kv: boolean;
  byApp: Record<AppKind, Record<string, number>>;
  total: Record<string, number>;
}> {
  const kv = getKV(env);
  const byApp: Record<AppKind, Record<string, number>> = { site: {}, lobby: {}, game: {} };
  const total: Record<string, number> = {};

  if (!kv) return { kv: false, byApp, total };

  // Build last 24 hour keys prefixes, but KV list is prefix-only.
  // We list all e:<app>: and filter by hour key substring.
  const now = new Date();
  const hours: string[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() - i * 3600_000);
    hours.push(hourKeyUTC(d));
  }
  const hoursSet = new Set(hours);

  for (const a of APPS) {
    const keys = await kvListAll(kv, `e:${a}:`);
    for (const key of keys) {
      // e:<app>:<YYYYMMDDHH>:<name>
      const parts = key.split(":");
      if (parts.length < 4) continue;
      const hh = parts[2];
      const name = parts.slice(3).join(":");
      if (!hoursSet.has(hh)) continue;

      const vRaw = await kv.get(key);
      const v = Number(vRaw || "0");
      if (!Number.isFinite(v) || v <= 0) continue;

      byApp[a][name] = (byApp[a][name] || 0) + v;
      total[name] = (total[name] || 0) + v;
    }
  }

  return { kv: true, byApp, total };
}

/**
 * Admin snapshots: store arbitrary JSON payloads, list, load
 * Keys:
 *   s:list -> JSON array of ids (newest first)
 *   s:item:<id> -> payload JSON
 */
export async function saveSnapshot(env: Env, payload: unknown): Promise<{ ok: boolean; id?: string }> {
  const kv = getKV(env);
  if (!kv) return { ok: false };

  const id = `s_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  const itemKey = `s:item:${id}`;

  await kv.put(itemKey, JSON.stringify(payload), { expirationTtl: 30 * 24 * 60 * 60 }); // 30d

  const listKey = "s:list";
  const listRaw = await kv.get(listKey);
  let list: string[] = [];
  try {
    list = JSON.parse(listRaw || "[]");
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  const next = [id, ...list.filter((x) => x && x !== id)].slice(0, 50);
  await kv.put(listKey, JSON.stringify(next), { expirationTtl: 30 * 24 * 60 * 60 });

  return { ok: true, id };
}

export async function listSnapshots(env: Env): Promise<{ ok: boolean; ids: string[] }> {
  const kv = getKV(env);
  if (!kv) return { ok: false, ids: [] };

  const listRaw = await kv.get("s:list");
  try {
    const ids = JSON.parse(listRaw || "[]");
    if (Array.isArray(ids)) return { ok: true, ids: ids.filter(Boolean).slice(0, 50) };
  } catch {
    // ignore
  }
  return { ok: true, ids: [] };
}

export async function loadSnapshot(env: Env, id: string): Promise<{ ok: boolean; payload?: unknown }> {
  const kv = getKV(env);
  if (!kv) return { ok: false };

  const safeId = clampStr(id, 120);
  if (!safeId.startsWith("s_")) return { ok: false };

  const raw = await kv.get(`s:item:${safeId}`);
  if (!raw) return { ok: false };

  try {
    return { ok: true, payload: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}
