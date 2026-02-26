// functions/api/lobby/poll/chat/send.ts
import { addChat, safeId, safeName, safeRoom, safeText } from "../_lib/kv";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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
  const text = safeText(body?.text);

  if (!id || !text) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const now = Date.now();
  await addChat(env, room, { id: `c_${uid()}`, at: now, fromName: name, text });

  return new Response(JSON.stringify({ ok: true, room, serverTime: now }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
