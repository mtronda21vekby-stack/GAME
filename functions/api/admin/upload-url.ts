import { json, badRequest, unauthorized, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";
import { getAdminCookie, verifyAdminSession } from "../../_lib/auth";
import { hmacSha256Base64Url, safeFileName } from "../../_lib/crypto";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "POST") return methodNotAllowed();

  const token = getAdminCookie(ctx.request);
  if (!token) return unauthorized();

  const ok = await verifyAdminSession(ctx.env.SESSION_SECRET, token);
  if (!ok) return unauthorized();

  let body: any = null;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const filename = safeFileName(String(body?.filename ?? "file"));
  const contentType = String(body?.contentType ?? "application/octet-stream");

  const dt = new Date();
  const y = String(dt.getUTCFullYear());
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const key = `${y}/${m}/${crypto.randomUUID()}-${filename}`;

  const exp = Date.now() + 1000 * 60 * 10; // 10 мин
  const payload = `${key}:${exp}:${contentType}`;
  const sig = await hmacSha256Base64Url(ctx.env.UPLOAD_SECRET, payload);

  const uploadUrl = `/api/admin/upload?key=${encodeURIComponent(key)}&exp=${exp}&ct=${encodeURIComponent(contentType)}&sig=${encodeURIComponent(sig)}`;
  const publicUrl = `/media/${encodeURIComponent(key)}`;

  return json({ uploadUrl, publicUrl });
};
