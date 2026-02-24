import { Env, getMetricsKV } from "../_lib/auth";
import { getOrSetUserId } from "../_lib/user";

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(extraHeaders || {}),
    },
  });
}

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(v)));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: true, kv: false, xp: 0 });

  const { uid, setCookieHeader } = getOrSetUserId(request, env);

  const raw = await kv.get(`xp:v1:${uid}`);
  const n = Number(raw || "0");
  const xp = Number.isFinite(n) ? clampInt(n, 0, 2_000_000_000) : 0;

  const headers: Record<string, string> = {};
  if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

  return json({ ok: true, kv: true, xp }, 200, headers);
};
