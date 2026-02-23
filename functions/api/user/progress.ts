import { json, badRequest, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";
import { levelFromXp, nextLevelXp, statusFromXp } from "@blackcrown/core";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "GET") return methodNotAllowed();

  const gid = ctx.request.headers.get("x-bc-guest");
  if (!gid) return badRequest("Missing guest id");

  const row = await ctx.env.DB.prepare("SELECT xp FROM users WHERE id=?1").bind(gid).first<any>();
  const xp = Number(row?.xp ?? 0);
  const level = levelFromXp(xp);
  const status = statusFromXp(xp);

  return json({ xp, level, status, nextLevelXp: nextLevelXp(level + 1) });
};
