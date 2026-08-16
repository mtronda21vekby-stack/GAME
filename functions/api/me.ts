// functions/api/me.ts
import { Env, getMetricsKV } from "./_lib/auth";
import { setUserSessionCookie, userSessionConfigured, verifyUserSession } from "./_lib/user-session";

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

function sanitizeNickname(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 24).trim();
}

function sanitizeUrl(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  if (t.startsWith("/")) return t.slice(0, 200);
  if (t.startsWith("https://")) return t.slice(0, 200);
  return "";
}

const USER_TTL = 180 * 24 * 60 * 60;

async function kvGetJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function authenticatedUser(request: Request, env: Env): Promise<string> {
  const session = await verifyUserSession(request, env);
  return session?.userId || "";
}

async function refreshedSessionHeader(env: Env, uid: string): Promise<Record<string, string> | null> {
  const cookie = await setUserSessionCookie(env, uid, USER_TTL);
  return cookie ? { "Set-Cookie": cookie } : null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: false, reason: "kv_off" }, 503);
  if (!userSessionConfigured(env)) return json({ ok: false, reason: "session_unavailable" }, 503);

  const uid = await authenticatedUser(request, env);
  if (!uid) return json({ ok: false, reason: "unauthorized" }, 401);

  const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${uid}`);
  if (!prof || prof.id !== uid) return json({ ok: false, reason: "unauthorized" }, 401);

  prof.lastSeenAt = Date.now();
  await kv.put(`user:v1:${uid}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
  const headers = await refreshedSessionHeader(env, uid);
  if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
  return json({ ok: true, profile: prof }, 200, headers);
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: false, reason: "kv_off" }, 503);
  if (!userSessionConfigured(env)) return json({ ok: false, reason: "session_unavailable" }, 503);

  const uid = await authenticatedUser(request, env);
  if (!uid) return json({ ok: false, reason: "unauthorized" }, 401);

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
    const nickname = sanitizeNickname(body.nickname);
    if (nickname) next.nickname = nickname;
  }
  if (typeof body.avatarUrl === "string") {
    const avatarUrl = sanitizeUrl(body.avatarUrl);
    if (avatarUrl) next.avatarUrl = avatarUrl;
  }
  next.lastSeenAt = Date.now();
  await kv.put(`user:v1:${uid}`, JSON.stringify(next), { expirationTtl: USER_TTL });

  const headers = await refreshedSessionHeader(env, uid);
  if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
  return json({ ok: true, profile: next }, 200, headers);
};
