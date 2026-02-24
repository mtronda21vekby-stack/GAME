// functions/api/lobby/_lib.ts
import { Env, getMetricsKV } from "../_lib/auth";

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function getLobbyKV(env: Env): KVNamespace | null {
  // MVP: используем тот же KV, что и метрики (как сейчас у тебя)
  return getMetricsKV(env);
}

export function safeId(s: string) {
  return String(s || "")
    .trim()
    .slice(0, 160)
    .replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
}

export function clampInt(v: unknown, min: number, max: number, def: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function clampText(s: string, max: number) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export function now() {
  return Date.now();
}
