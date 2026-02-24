import { Env } from "../api/_lib/auth";
import { json, getLobbyKV, safeId, clampText, now } from "../api/lobby/_lib";

type Body = {
  roomId?: string;
  clientId?: string;
  nick?: string;
  text?: string;
  clientMsgId?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getLobbyKV(env);
  if (!kv) return json({ ok: true, kv: false });

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }

  const roomId = safeId(body.roomId || "main") || "main";
  const clientId = safeId(body.clientId || "");
  const nick = clampText(body.nick || "Player", 18);
  const text = clampText(body.text || "", 400);
  const clientMsgId = safeId(body.clientMsgId || "");

  if (!clientId || !text || !clientMsgId) {
    return json({ ok: false, reason: "bad_payload" }, 400);
  }

  const key = `l:room:${roomId}:chat:last`;

  const raw = await kv.get(key);
  let items: any[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    } catch {}
  }

  // 🧠 КРИТИЧНО: если уже есть такое сообщение — не добавляем повторно
  if (!items.find((x) => x.id === clientMsgId)) {
    items.push({
      id: clientMsgId,
      t: now(),
      nick,
      text,
    });
  }

  // ограничиваем историю
  if (items.length > 80) {
    items = items.slice(items.length - 80);
  }

  await kv.put(key, JSON.stringify(items), {
    expirationTtl: 60 * 60 * 6,
  });

  return json({ ok: true, kv: true });
};
