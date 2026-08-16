// functions/api/auth/guest.ts
import { Env, getMetricsKV } from "../_lib/auth";
import { setUserSessionCookie, userSessionConfigured, verifyUserSession } from "../_lib/user-session";

type Body = {
  clientId?: string;
  nickname?: string;
};

type UserProfileV1 = {
  v: 1;
  id: string;
  createdAt: number;
  lastSeenAt: number;
  nickname: string;
  avatarUrl?: string;
  roles?: string[];
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
  return s.trim().slice(0, 160).replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
}

function sanitizeNickname(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 24).trim();
}

function newUserId() {
  try {
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  const rnd = Math.random().toString(16).slice(2);
  return `u_${Date.now().toString(16)}_${rnd}`;
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

async function sessionHeader(env: Env, userId: string): Promise<Record<string, string> | null> {
  const cookie = await setUserSessionCookie(env, userId, USER_TTL);
  return cookie ? { "Set-Cookie": cookie } : null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: false, reason: "kv_off" }, 503);
  if (!userSessionConfigured(env)) return json({ ok: false, reason: "session_unavailable" }, 503);

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  // 1) Only a cryptographically signed session may resume by cookie.
  const session = await verifyUserSession(request, env);
  if (session?.userId) {
    const uid = safeId(session.userId);
    const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${uid}`);
    if (prof && prof.id === uid) {
      prof.lastSeenAt = Date.now();
      await kv.put(`user:v1:${uid}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
      const headers = await sessionHeader(env, uid);
      if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
      return json({ ok: true, userId: uid, profile: prof, from: "session" }, 200, headers);
    }
  }

  // 2) clientId remains a high-entropy device bootstrap/recovery credential.
  // It can create/restore a guest session, but commerce authorization after
  // this point always requires the signed server-issued session cookie.
  const clientIdRaw = String(body.clientId || "").trim();
  if (!clientIdRaw) return json({ ok: false, reason: "missing_clientId" }, 400);
  const clientId = safeId(clientIdRaw);
  if (clientId.length < 20) return json({ ok: false, reason: "weak_clientId" }, 400);
  const mapKey = `cid:v1:${clientId}`;

  let userId = await kv.get(mapKey);
  userId = userId ? safeId(userId) : "";

  if (userId) {
    const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${userId}`);
    if (prof && prof.id === userId) {
      prof.lastSeenAt = Date.now();
      await kv.put(`user:v1:${userId}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
      await kv.put(mapKey, userId, { expirationTtl: USER_TTL });
      const headers = await sessionHeader(env, userId);
      if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
      return json({ ok: true, userId, profile: prof, from: "clientId" }, 200, headers);
    }
  }

  const now = Date.now();
  const nickname = sanitizeNickname(body.nickname || "") || "Игрок";
  const uid = safeId(newUserId());
  const profile: UserProfileV1 = {
    v: 1,
    id: uid,
    createdAt: now,
    lastSeenAt: now,
    nickname,
    roles: ["guest"],
  };

  await kv.put(`user:v1:${uid}`, JSON.stringify(profile), { expirationTtl: USER_TTL });
  await kv.put(mapKey, uid, { expirationTtl: USER_TTL });
  const headers = await sessionHeader(env, uid);
  if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
  return json({ ok: true, userId: uid, profile, from: "new" }, 200, headers);
};
