// functions/api/auth/guest.ts
import { Env, getMetricsKV, getUserIdCookie, setUserIdCookie } from "../_lib/auth";

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
  return s
    .trim()
    .slice(0, 160)
    .replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
}

function sanitizeNickname(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  // мягкая чистка (без матча по языкам): режем длину и убираем управляющие
  const cleaned = t.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 24);
  return cleaned.trim();
}

function newUserId() {
  // Cloudflare Workers поддерживает crypto.randomUUID()
  // но на всякий случай — fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  const rnd = Math.random().toString(16).slice(2);
  return `u_${Date.now().toString(16)}_${rnd}`;
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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: false, reason: "kv_off" }, 503);

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  // 1) Если уже есть cookie — возвращаем профиль
  const cookieUserId = getUserIdCookie(request);
  if (cookieUserId) {
    const uid = safeId(cookieUserId);
    const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${uid}`);
    if (prof && prof.id === uid) {
      const now = Date.now();
      prof.lastSeenAt = now;
      // refresh TTL + lastSeen
      await kv.put(`user:v1:${uid}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
      return json(
        { ok: true, userId: uid, profile: prof, from: "cookie" },
        200,
        { "Set-Cookie": setUserIdCookie(uid, USER_TTL) }
      );
    }
    // cookie битый/устарел — продолжим через clientId
  }

  // 2) Нужен clientId для поиска/создания
  const clientIdRaw = String(body.clientId || "").trim();
  if (!clientIdRaw) return json({ ok: false, reason: "missing_clientId" }, 400);

  const clientId = safeId(clientIdRaw);
  const mapKey = `cid:v1:${clientId}`;

  let userId = await kv.get(mapKey);
  userId = userId ? safeId(userId) : "";

  // 3) Если маппинг есть — читаем профиль
  if (userId) {
    const prof = await kvGetJson<UserProfileV1>(kv, `user:v1:${userId}`);
    if (prof && prof.id === userId) {
      const now = Date.now();
      prof.lastSeenAt = now;
      await kv.put(`user:v1:${userId}`, JSON.stringify(prof), { expirationTtl: USER_TTL });
      await kv.put(mapKey, userId, { expirationTtl: USER_TTL });

      return json(
        { ok: true, userId, profile: prof, from: "clientId" },
        200,
        { "Set-Cookie": setUserIdCookie(userId, USER_TTL) }
      );
    }
    // если профиль потерян — пересоздадим
  }

  // 4) Создаём нового guest user
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

  return json(
    { ok: true, userId: uid, profile, from: "new" },
    200,
    { "Set-Cookie": setUserIdCookie(uid, USER_TTL) }
  );
};
