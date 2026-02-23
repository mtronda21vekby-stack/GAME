import { json, badRequest, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";
import { xpForEvent, cooldownMsForEvent, dedupeKeyForEvent, levelFromXp, nextLevelXp, statusFromXp } from "@blackcrown/core";
import type { XpEvent } from "@blackcrown/core";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "POST") return methodNotAllowed();

  const gid = ctx.request.headers.get("x-bc-guest");
  if (!gid) return badRequest("Missing guest id");

  let body: any = null;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const event = body?.event as XpEvent | undefined;
  if (!event || typeof event.type !== "string") return badRequest("event required");

  const amount = xpForEvent(event);
  if (amount <= 0) return badRequest("Invalid event");

  const cooldown = cooldownMsForEvent(event);
  const bucket = Math.floor(Date.now() / Math.max(1000, cooldown));
  const dedupe = dedupeKeyForEvent(event, bucket);

  const now = Date.now();

  // ensure user exists
  await ctx.env.DB.prepare(
    "INSERT INTO users (id, created_at, last_seen, xp) VALUES (?1, ?2, ?3, 0) ON CONFLICT(id) DO UPDATE SET last_seen=?3"
  ).bind(gid, now, now).run();

  // insert XP event with unique(user_id, dedupe_key)
  const inserted = await ctx.env.DB.prepare(
    "INSERT OR IGNORE INTO xp_events (user_id, type, ekey, amount, ts, dedupe_key) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
  ).bind(gid, event.type, event.key ?? null, amount, now, dedupe).run();

  if ((inserted.meta?.changes ?? 0) > 0) {
    await ctx.env.DB.prepare("UPDATE users SET xp = xp + ?1, last_seen=?2 WHERE id=?3").bind(amount, now, gid).run();
  } else {
    await ctx.env.DB.prepare("UPDATE users SET last_seen=?1 WHERE id=?2").bind(now, gid).run();
  }

  const row = await ctx.env.DB.prepare("SELECT xp FROM users WHERE id=?1").bind(gid).first<any>();
  const xp = Number(row?.xp ?? 0);
  const level = levelFromXp(xp);
  const status = statusFromXp(xp);
  const nxl = nextLevelXp(level + 1);

  return json({ xp, level, status, nextLevelXp: nxl });
};
