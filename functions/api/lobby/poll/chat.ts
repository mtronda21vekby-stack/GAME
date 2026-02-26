// functions/api/lobby/poll/chat.ts
import { getChat, safeRoom } from "./_lib/kv";

export async function onRequestGet(ctx: any) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const room = safeRoom(url.searchParams.get("room") || "main");

  const items = await getChat(env, room);

  return new Response(JSON.stringify({ ok: true, room, serverTime: Date.now(), items }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
