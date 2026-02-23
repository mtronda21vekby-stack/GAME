import { json, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "GET") return methodNotAllowed();

  const gid = ctx.request.headers.get("x-bc-guest") || crypto.randomUUID();
  const now = Date.now();

  await ctx.env.DB.prepare(
    "INSERT INTO users (id, created_at, last_seen, xp) VALUES (?1, ?2, ?3, 0) " +
      "ON CONFLICT(id) DO UPDATE SET last_seen=?3"
  ).bind(gid, now, now).run();

  return json({ id: gid });
};
