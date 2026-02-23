
import { json, badRequest, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";
import { signAdminSession } from "../../_lib/auth";
import { timingSafeEqual } from "../../_lib/crypto";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "POST") return methodNotAllowed();

  let body: any = null;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const password = String(body?.password ?? "");
  if (!password) return badRequest("Password required");

  if (!timingSafeEqual(password, ctx.env.ADMIN_PASSWORD)) {
    return json({ ok: false }, { status: 401 });
  }

  const token = await signAdminSession(ctx.env.SESSION_SECRET, 1000 * 60 * 60 * 8); // 8h
  const headers = new Headers();
  headers.append(
    "set-cookie",
    `bc_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 8}`
  );

  return json({ ok: true }, { headers });
};
