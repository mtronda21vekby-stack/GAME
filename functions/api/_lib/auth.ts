// functions/api/_lib/auth.ts

export type Env = {
  BC_ADMIN_PASSWORD?: string;
  BC_ADMIN_SECRET?: string;

  // backward/alternate names
  ADMIN_PASSWORD?: string;
  ADMIN_SECRET?: string;

  // KV bindings (any name variants)
  BC_KV?: KVNamespace;
  METRICS_KV?: KVNamespace;
  KV?: KVNamespace;

  // Durable Objects (Lobby WS)
  // поддерживаем оба имени, чтобы не ломать текущие деплои/конфиги
  LOBBY_ROOM?: DurableObjectNamespace;
  LOBBY_ROOMS?: DurableObjectNamespace;

  // D1 (если используешь для истории/матчей)
  LOBBY_DB?: D1Database;

  // Service binding to WS worker (Pages -> Settings -> Functions -> Bindings)
  // Name: LOBBY_WS, Service: blackcrown-lobby-ws
  LOBBY_WS?: Fetcher;

  // allow any other env fields without TS pain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type CookieOpts = {
  maxAgeSec?: number;
  path?: string;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

export function getAdminPassword(env: Env): string {
  return String(env.BC_ADMIN_PASSWORD || env.ADMIN_PASSWORD || "").trim();
}

export function getAdminSecret(env: Env): string {
  return String(env.BC_ADMIN_SECRET || env.ADMIN_SECRET || "").trim();
}

export function setCookie(name: string, value: string, opts: CookieOpts = {}): string {
  const maxAge = typeof opts.maxAgeSec === "number" ? Math.max(0, Math.floor(opts.maxAgeSec)) : undefined;
  const path = opts.path || "/";
  const httpOnly = opts.httpOnly ?? true;
  const sameSite = opts.sameSite || "Lax";
  const secure = opts.secure ?? true;

  const parts: string[] = [];
  parts.push(`${name}=${value}`);
  parts.push(`Path=${path}`);
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (httpOnly) parts.push("HttpOnly");
  parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push("Secure");

  return parts.join("; ");
}

export function clearCookie(name: string, opts: CookieOpts = {}): string {
  return setCookie(name, "", { ...opts, maxAgeSec: 0 });
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const items = cookieHeader.split(";");
  for (const it of items) {
    const idx = it.indexOf("=");
    if (idx <= 0) continue;
    const k = it.slice(0, idx).trim();
    const v = it.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

export function readCookie(request: Request, name: string): string | null {
  const all = parseCookieHeader(request.headers.get("Cookie"));
  return all[name] ?? null;
}

function b64UrlEncodeBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64UrlEncodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  return b64UrlEncodeBytes(bytes);
}

function b64UrlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function hmacVerify(secret: string, data: string, sigBytes: Uint8Array): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
}

export type AdminClaims = {
  typ: "admin";
  iat: number; // unix seconds
  exp: number; // unix seconds
};

export async function signAdminToken(env: Env, maxAgeSec: number): Promise<string | null> {
  const secret = getAdminSecret(env);
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AdminClaims = { typ: "admin", iat: now, exp: now + Math.max(60, Math.floor(maxAgeSec)) };

  const h = b64UrlEncodeJson(header);
  const p = b64UrlEncodeJson(payload);
  const data = `${h}.${p}`;

  const sig = await hmacSha256(secret, data);
  const s = b64UrlEncodeBytes(sig);

  return `${data}.${s}`;
}

export async function verifyAdminToken(request: Request, env: Env): Promise<AdminClaims | null> {
  const secret = getAdminSecret(env);
  if (!secret) return null;

  const token = readCookie(request, "bc_admin");
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [h, p, s] = parts;
  const data = `${h}.${p}`;

  const sigBytes = b64UrlDecodeToBytes(s);
  const ok = await hmacVerify(secret, data, sigBytes);
  if (!ok) return null;

  const payloadBytes = b64UrlDecodeToBytes(p);
  const payloadJson = new TextDecoder().decode(payloadBytes);
  const claims = safeJsonParse<AdminClaims>(payloadJson);
  if (!claims || claims.typ !== "admin") return null;

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || claims.exp <= now) return null;

  return claims;
}

// compat wrapper
export async function verifyAdmin(request: Request, env: Env): Promise<boolean> {
  const claims = await verifyAdminToken(request, env);
  return !!claims;
}

// KV helper (metrics / general)
export function getMetricsKV(env: Env): KVNamespace | null {
  return (env.BC_KV || env.METRICS_KV || env.KV || null) as any;
}

/**
 * Durable Object helper (Lobby).
 * Важно: имя биндинга в Cloudflare Pages/Functions должно совпадать:
 * - LOBBY_ROOM (если один класс-объект по комнате)
 * - или LOBBY_ROOMS (если так назвал биндинг)
 */
export function getLobbyDO(env: Env): DurableObjectNamespace | null {
  return (env.LOBBY_ROOM || env.LOBBY_ROOMS || null) as any;
}

/**
 * Service binding helper (Lobby WS Worker).
 * Pages -> Settings -> Functions -> Bindings:
 * - Service binding name: LOBBY_WS
 * - Service: blackcrown-lobby-ws
 */
export function getLobbyWsService(env: Env): Fetcher | null {
  return (env.LOBBY_WS || null) as any;
}

/* =========================
   User cookie helpers (v1)
   ========================= */

export function getUserIdCookie(request: Request): string | null {
  return readCookie(request, "bc_uid");
}

export function setUserIdCookie(userId: string, maxAgeSec = 180 * 24 * 60 * 60): string {
  return setCookie("bc_uid", userId, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: true,
    maxAgeSec,
  });
}

export function clearUserIdCookie(): string {
  return clearCookie("bc_uid", { path: "/" });
}
