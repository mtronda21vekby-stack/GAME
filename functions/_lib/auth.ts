import { getCookie } from "./http";
import { hmacSha256Base64Url, timingSafeEqual } from "./crypto";

type SessionPayload = { sub: "admin"; exp: number };

function b64urlJson(obj: unknown): string {
  const s = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseB64urlJson(s: string): any {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}

export async function signAdminSession(secret: string, ttlMs: number): Promise<string> {
  const payload: SessionPayload = { sub: "admin", exp: Date.now() + ttlMs };
  const p = b64urlJson(payload);
  const sig = await hmacSha256Base64Url(secret, p);
  return `${p}.${sig}`;
}

export async function verifyAdminSession(secret: string, token: string): Promise<boolean> {
  const [p, sig] = token.split(".");
  if (!p || !sig) return false;
  const expect = await hmacSha256Base64Url(secret, p);
  if (!timingSafeEqual(expect, sig)) return false;

  const data = parseB64urlJson(p) as SessionPayload;
  if (!data || data.sub !== "admin") return false;
  if (Date.now() > data.exp) return false;

  return true;
}

export function getAdminCookie(req: Request): string | null {
  return getCookie(req, "bc_admin");
}
