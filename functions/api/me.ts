// functions/api/me.ts
import { Env, getMetricsKV, getUserIdCookie, setUserIdCookie } from "./_lib/auth";

type UserProfileV1 = {
  v: 1;
  id: string;
  createdAt: number;
  lastSeenAt: number;
  nickname: string;
  avatarUrl?: string;
  roles?: string[];
};

type PatchBody = {
  nickname?: string;
  avatarUrl?: string;
};

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(headers || {}),
    },
  });
}

function safeId(s: string) {
  return s
    .trim()
    .slice(0, 160)
    .replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
}

function sanitizeNickname(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  const cleaned = t.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 24);
  return cleaned.trim();
}

function sanitizeUrl(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  // разрешаем только относительные или https
  if (t.startsWith("/")) return t.slice(0, 200);
  if (t.startsWith("https://")) return t.slice(0, 200);
  return "";
}

const USER_TTL = 180 * 24 * 60 * 60; // 180d

async function kvGetJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: false, reason: "kv_off" }, 503);

  const cookieUserId = getUserIdCookie(request);
  if (!cookieUserId) return json({ ok: false, reason: "unauthorized" }, 401);

  const uid = safeId(cookieUserId);
  const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${uid}`);
  if (!prof || prof.id !== uid) return json({ ok: false, reason: "unauthorized" }, 401);

  prof.lastSeenAt = Date.now();
  await kv.put(`user:v1:${uid}`, JSON.stringify(prof), { expirationTtl: USER_TTL });

  return json({ ok: true, profile: prof }, 200, { "Set-Cookie": setUserIdCookie(uid, USER_TTL) });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: false, reason: "kv_off" }, 503);

  const cookieUserId = getUserIdCookie(request);
  if (!cookieUserId) return json({ ok: false, reason: "unauthorized" }, 401);

  const uid = safeId(cookieUserId);
  const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${uid}`);
  if (!prof || prof.id !== uid) return json({ ok: false, reason: "unauthorized" }, 401);

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    body = {};
  }

  const next: UserProfileV1 = { ...prof };

  if (typeof body.nickname === "string") {
    const n = sanitizeNickname(body.nickname);
    if (n) next.nickname = n;
  }

  if (typeof body.avatarUrl === "string") {
    const u = sanitizeUrl(body.avatarUrl);
    if (u) next.avatarUrl = u;
  }

  next.lastSeenAt = Date.now();

  await kv.put(`user:v1:${uid}`, JSON.stringify(next), { expirationTtl: USER_TTL });

  return json({ ok: true, profile: next }, 200, { "Set-Cookie": setUserIdCookie(uid, USER_TTL) });
};
