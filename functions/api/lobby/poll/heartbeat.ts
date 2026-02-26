// functions/api/lobby/poll/heartbeat.ts
import { safeId, safeName, safeRoom, upsertPlayer } from "./_lib/kv";

export async function onRequestPost(ctx: any) {
  const { request, env } = ctx;

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const room = safeRoom(body?.room);
  const id = safeId(body?.clientId);
  const name = safeName(body?.name);
  const ready = !!body?.ready;

  if (!id) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const now = Date.now();

  await upsertPlayer(env, room, {
    id,
    name,
    ready,
    joinedAt: typeof body?.joinedAt === "number" ? body.joinedAt : now,
    lastSeen: now,
  });

  return new Response(JSON.stringify({ ok: true, room, serverTime: now }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
