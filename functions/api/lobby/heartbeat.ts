// functions/api/lobby/heartbeat.ts
import { Env } from "../_lib/auth";
import { json, getLobbyKV, safeId, clampInt, clampText, now } from "./_lib";

type Body = {
  roomId?: string;
  clientId?: string;
  nick?: string;
  ready?: boolean;
  ttl?: number; // seconds
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getLobbyKV(env);
  if (!kv) return json({ ok: true, kv: false });

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const roomId = safeId(body.roomId || "main") || "main";
  const clientId = safeId(body.clientId || "");
  const nick = clampText(body.nick || "Player", 18);
  const ttl = clampInt(body.ttl, 20, 600, 60);

  if (!clientId) return json({ ok: false, reason: "missing_clientId" }, 400);

  const seenAt = now();

  // presence
  await kv.put(`l:room:${roomId}:p:${clientId}`, JSON.stringify({ nick, at: seenAt }), {
    expirationTtl: ttl,
  });

  // ready (опционально)
  const ready = body.ready === true;
  await kv.put(`l:room:${roomId}:r:${clientId}`, ready ? "1" : "0", {
    expirationTtl: ttl,
  });

  return json({ ok: true, kv: true, roomId, ttl, seenAt });
};
