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

async function deterministicGuestId(clientId: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`blackcrown:guest:${clientId}`));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `u_${hex.slice(0, 48)}`;
}

function ephemeralProfile(userId: string, nickname = "Игрок"): UserProfileV1 {
  const now = Date.now();
  return {
    v: 1,
    id: userId,
    createdAt: now,
    lastSeenAt: now,
    nickname,
    roles: ["guest"],
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Account identity must not depend on an optional KV binding. KV enriches
  // the site profile/commerce layer when present; the signed bc_session is
  // sufficient for BLACK CROWN account linking and entitlement identity.
  const kv = getMetricsKV(env);
  if (!userSessionConfigured(env)) return json({ ok: false, reason: "session_unavailable" }, 503);

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  // 1) A valid signed session always wins. When KV is not configured we can
  // still refresh the same identity instead of failing with kv_off.
  const session = await verifyUserSession(request, env);
  if (session?.userId) {
    const uid = safeId(session.userId);
    if (kv) {
      const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${uid}`);
      if (prof && prof.id === uid) {
        prof.lastSeenAt = Date.now();
        await kv.put(`user:v1:${uid}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
        const headers = await sessionHeader(env, uid);
        if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
        return json({ ok: true, userId: uid, profile: prof, from: "session" }, 200, headers);
      }
    } else {
      const headers = await sessionHeader(env, uid);
      if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
      return json({ ok: true, userId: uid, profile: ephemeralProfile(uid), from: "session-stateless" }, 200, headers);
    }
  }

  // 2) clientId is the high-entropy device bootstrap/recovery credential.
  const clientIdRaw = String(body.clientId || "").trim();
  if (!clientIdRaw) return json({ ok: false, reason: "missing_clientId" }, 400);
  const clientId = safeId(clientIdRaw);
  if (clientId.length < 20) return json({ ok: false, reason: "weak_clientId" }, 400);
  const mapKey = `cid:v1:${clientId}`;

  if (kv) {
    let mappedUserId = await kv.get(mapKey);
    mappedUserId = mappedUserId ? safeId(mappedUserId) : "";
    if (mappedUserId) {
      const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${mappedUserId}`);
      if (prof && prof.id === mappedUserId) {
        prof.lastSeenAt = Date.now();
        await kv.put(`user:v1:${mappedUserId}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
        await kv.put(mapKey, mappedUserId, { expirationTtl: USER_TTL });
        const headers = await sessionHeader(env, mappedUserId);
        if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
        return json({ ok: true, userId: mappedUserId, profile: prof, from: "clientId" }, 200, headers);
      }
    }
  }

  // 3) New/recovered identity is deterministic for this high-entropy clientId.
  // This makes recovery stable even on Pages deployments without KV, while
  // the actual authorization remains the server-signed HttpOnly bc_session.
  const derived = await deterministicGuestId(clientId);
  if (!derived) return json({ ok: false, reason: "secure_random_unavailable" }, 503);
  const uid = safeId(derived);
  const nickname = sanitizeNickname(body.nickname || "") || "Игрок";
  const profile = ephemeralProfile(uid, nickname);

  if (kv) {
    await kv.put(`user:v1:${uid}`, JSON.stringify(profile), { expirationTtl: USER_TTL });
    await kv.put(mapKey, uid, { expirationTtl: USER_TTL });
  }

  const headers = await sessionHeader(env, uid);
  if (!headers) return json({ ok: false, reason: "session_unavailable" }, 503);
  return json({ ok: true, userId: uid, profile, from: kv ? "new" : "clientId-stateless" }, 200, headers);
};
