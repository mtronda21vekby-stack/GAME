// functions/api/lobby/chat_send.ts
import { Env } from "../_lib/auth";
import { json, getLobbyKV, safeId, clampText, now } from "./_lib";

type Body = {
  roomId?: string;
  clientId?: string;
  nick?: string;
  text?: string;
};

type ChatItem = { id: string; t: number; nick: string; text: string };

function makeId() {
  return `m_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

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
  const text = clampText(body.text || "", 280);

  if (!clientId) return json({ ok: false, reason: "missing_clientId" }, 400);
  if (!text) return json({ ok: false, reason: "empty_text" }, 400);

  const item: ChatItem = { id: makeId(), t: now(), nick, text };
  const key = `l:room:${roomId}:chat:last`;

  // best-effort “append last 60”
  const curRaw = await kv.get(key);
  let arr: ChatItem[] = [];
  if (curRaw) {
    try {
      const v = JSON.parse(curRaw);
      if (Array.isArray(v)) arr = v as ChatItem[];
    } catch {
      // ignore
    }
  }

  arr.push(item);
  if (arr.length > 60) arr = arr.slice(arr.length - 60);

  await kv.put(key, JSON.stringify(arr), { expirationTtl: 7 * 24 * 60 * 60 });

  return json({ ok: true, kv: true, item });
};
