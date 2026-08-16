import { getAdminSecret, readCookie, setCookie, type Env } from "./auth";

const COOKIE_NAME = "bc_session";
const TOKEN_VERSION = "v1";
const DEFAULT_TTL = 180 * 24 * 60 * 60;

export type UserSessionClaims = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

function b64UrlEncodeBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64UrlDecodeToBytes(value: string): Uint8Array | null {
  try {
    const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
    const b64 = (value + pad).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function safeUserId(value: unknown): string {
  const id = String(value ?? "").trim();
  if (!id || id.length > 160) return "";
  if (!/^[a-zA-Z0-9_\-:.@]+$/.test(id)) return "";
  return id;
}

function getSessionSecret(env: Env): string {
  // Dedicated key is preferred. Existing admin secret is a compatibility
  // fallback with explicit domain separation so rollout can be fail-closed
  // without forcing a production outage while BC_USER_SESSION_SECRET is added.
  return String(
    env.BC_USER_SESSION_SECRET ||
      env.BC_SESSION_SECRET ||
      env.USER_SESSION_SECRET ||
      getAdminSecret(env) ||
      "",
  ).trim();
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`blackcrown:user-session:${data}`),
  );
  return new Uint8Array(signature);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function userSessionConfigured(env: Env): boolean {
  return !!getSessionSecret(env);
}

export async function createUserSessionToken(
  env: Env,
  userIdInput: string,
  maxAgeSec = DEFAULT_TTL,
): Promise<string | null> {
  const secret = getSessionSecret(env);
  const userId = safeUserId(userIdInput);
  if (!secret || !userId) return null;

  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(60, Math.min(Math.floor(maxAgeSec), DEFAULT_TTL));
  const payload = b64UrlEncodeBytes(
    new TextEncoder().encode(JSON.stringify({ sub: userId, iat: now, exp: now + ttl })),
  );
  const data = `${TOKEN_VERSION}.${payload}`;
  const signature = b64UrlEncodeBytes(await hmac(secret, data));
  return `${data}.${signature}`;
}

export async function verifyUserSession(request: Request, env: Env): Promise<UserSessionClaims | null> {
  const secret = getSessionSecret(env);
  if (!secret) return null;
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null;
  const [, payload, signature] = parts;
  const providedSignature = b64UrlDecodeToBytes(signature);
  if (!providedSignature) return null;

  const expectedSignature = await hmac(secret, `${TOKEN_VERSION}.${payload}`);
  if (!constantTimeEqual(providedSignature, expectedSignature)) return null;

  const payloadBytes = b64UrlDecodeToBytes(payload);
  if (!payloadBytes) return null;

  let parsed: { sub?: unknown; iat?: unknown; exp?: unknown };
  try {
    parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as typeof parsed;
  } catch {
    return null;
  }

  const userId = safeUserId(parsed.sub);
  const issuedAt = Number(parsed.iat);
  const expiresAt = Number(parsed.exp);
  const now = Math.floor(Date.now() / 1000);
  if (!userId || !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null;
  if (issuedAt > now + 60 || expiresAt <= now || expiresAt - issuedAt > DEFAULT_TTL + 60) return null;

  return { userId, issuedAt, expiresAt };
}

export async function setUserSessionCookie(
  env: Env,
  userId: string,
  maxAgeSec = DEFAULT_TTL,
): Promise<string | null> {
  const token = await createUserSessionToken(env, userId, maxAgeSec);
  if (!token) return null;
  return setCookie(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: true,
    maxAgeSec,
  });
}
