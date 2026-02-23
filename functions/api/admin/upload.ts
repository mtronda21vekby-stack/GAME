import { json, badRequest, unauthorized, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";
import { getAdminCookie, verifyAdminSession } from "../../_lib/auth";
import { hmacSha256Base64Url, timingSafeEqual } from "../../_lib/crypto";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "PUT") return methodNotAllowed();

  const token = getAdminCookie(ctx.request);
  if (!token) return unauthorized();
  const ok = await verifyAdminSession(ctx.env.SESSION_SECRET, token);
  if (!ok) return unauthorized();

  const url = new URL(ctx.request.url);
  const key = url.searchParams.get("key");
  const exp = url.searchParams.get("exp");
  const ct = url.searchParams.get("ct") || "application/octet-stream";
  const sig = url.searchParams.get("sig");

  if (!key || !exp || !sig) return badRequest("Missing params");
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || Date.now() > expNum) return badRequest("Expired");

  const payload = `${key}:${expNum}:${ct}`;
  const expect = await hmacSha256Base64Url(ctx.env.UPLOAD_SECRET, payload);
  if (!timingSafeEqual(expect, sig)) return unauthorized();

  const body = ctx.request.body;
  if (!body) return badRequest("Body required");

  await ctx.env.MEDIA.put(key, body, {
    httpMetadata: { contentType: ct },
  });

  return json({ ok: true, key, publicUrl: `/media/${encodeURIComponent(key)}` });
};
