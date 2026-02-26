// functions/api/lobby/poll/state.ts
import { listPlayers, safeRoom } from "./_lib/kv";

export async function onRequestGet(ctx: any) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const room = safeRoom(url.searchParams.get("room") || "main");

  const players = await listPlayers(env, room);

  return new Response(JSON.stringify({ ok: true, room, serverTime: Date.now(), players }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
