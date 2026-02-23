// functions/api/_lib/auth.ts
export type Env = {
  BC_ADMIN_PASSWORD?: string;
  BC_ADMIN_SECRET?: string;
};

function b64urlFromBytes(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesFromText(s: string) {
  return new TextEncoder().encode(s);
}

async function hmacSha256(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    bytesFromText(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, bytesFromText(data));
  return b64urlFromBytes(new Uint8Array(sig));
}

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("Cookie") || "";
  const parts = cookie.split(";").map((x) => x.trim());
  for (const p of parts) {
    if (!p) continue;
    const i = p.indexOf("=");
    if (i <= 0) continue;
    const k = p.slice(0, i).trim();
    if (k !== name) continue;
    return decodeURIComponent(p.slice(i + 1));
  }
  return "";
}

export function setCookie(name: string, value: string, opts: { maxAgeSec: number }) {
  // Secure нужен, т.к. Pages всегда https (и pages.dev тоже)
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${opts.maxAgeSec}`;
}

export function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

type AdminPayload = { v: 1; sub: "admin"; iat: number; exp: number };

export async function signAdminToken(env: Env, ttlSec: number) {
  const secret = env.BC_ADMIN_SECRET || "";
  if (!secret) return "";

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminPayload = { v: 1, sub: "admin", iat: now, exp: now + ttlSec };
  const body = b64urlFromBytes(bytesFromText(JSON.stringify(payload)));
  const sig = await hmacSha256(secret, body);
  return `${body}.${sig}`;
}

export async function verifyAdmin(req: Request, env: Env) {
  const secret = env.BC_ADMIN_SECRET || "";
  if (!secret) return false;

  const token = getCookie(req, "bc_admin");
  if (!token) return false;

  const [body, sig] = token.split(".");
  if (!body || !sig) return false;

  const expected = await hmacSha256(secret, body);
  if (expected !== sig) return false;

  let json: any = null;
  try {
    const raw = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    json = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!json || json.sub !== "admin" || typeof json.exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return now < json.exp;
}
