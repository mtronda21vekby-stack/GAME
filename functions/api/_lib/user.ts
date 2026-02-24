import { Env, readCookie, setCookie } from "./auth";

function safeId(s: string) {
  return String(s || "")
    .trim()
    .slice(0, 80)
    .replace(/[^a-zA-Z0-9_\-:.@]/g, "_");
}

function newId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `u_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function getOrSetUserId(request: Request, env: Env): { uid: string; setCookieHeader?: string } {
  const existing = readCookie(request, "bc_uid");
  if (existing) return { uid: safeId(existing) };

  const uid = safeId(newId());
  // Lax + Secure по умолчанию уже в setCookie, max-age 180 дней
  const sc = setCookie("bc_uid", uid, {
    maxAgeSec: 180 * 24 * 60 * 60,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: true,
  });

  return { uid, setCookieHeader: sc };
}
