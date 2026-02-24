// functions/api/lobby/chat.ts
import { Env } from "../_lib/auth";
import { json, getLobbyKV, safeId } from "./_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getLobbyKV(env);
  if (!kv) return json({ ok: true, kv: false, items: [], serverTime: Date.now() });

  const url = new URL(request.url);
  const roomId = safeId(url.searchParams.get("roomId") || "main") || "main";

  const key = `l:room:${roomId}:chat:last`;
  const raw = await kv.get(key);
  let items: any[] = [];
  if (raw) {
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) items = v;
    } catch {
      // ignore
    }
  }

  return json({ ok: true, kv: true, roomId, items, serverTime: Date.now() });
};
