// functions/api/lobby/state.ts
import { Env } from "../_lib/auth";
import { json, getLobbyKV, safeId } from "./_lib";

async function listAll(kv: KVNamespace, prefix: string, maxPages = 10) {
  let cursor: string | undefined = undefined;
  const keys: string[] = [];

  for (let i = 0; i < maxPages; i++) {
    const res = await kv.list({ prefix, cursor, limit: 1000 });
    for (const k of res.keys || []) keys.push(k.name);
    cursor = res.cursor;
    if (!cursor) break;
  }
  return keys;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const kv = getLobbyKV(env);
  if (!kv) return json({ ok: true, kv: false, users: [] });

  const url = new URL(request.url);
  const roomId = safeId(url.searchParams.get("roomId") || "main") || "main";

  const pfx = `l:room:${roomId}:p:`;
  const presenceKeys = await listAll(kv, pfx, 10);

  // читаем presence пачкой (по одному get; для MVP ок)
  const users = [];
  for (const key of presenceKeys) {
    const clientId = key.slice(pfx.length);
    const raw = await kv.get(key);
    if (!raw) continue;

    let nick = "Player";
    let at = 0;
    try {
      const v = JSON.parse(raw) as any;
      nick = String(v?.nick || "Player").slice(0, 18);
      at = Number(v?.at || 0) || 0;
    } catch {
      // ignore
    }

    const readyRaw = await kv.get(`l:room:${roomId}:r:${clientId}`);
    const ready = readyRaw === "1";

    users.push({ clientId, nick, ready, seenAt: at });
  }

  // сортировка: сначала ready, потом свежесть
  users.sort((a: any, b: any) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    return (b.seenAt || 0) - (a.seenAt || 0);
  });

  return json({ ok: true, kv: true, roomId, users });
};
