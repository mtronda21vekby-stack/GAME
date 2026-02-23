// functions/api/metrics/online-list.ts
import { Env, getMetricsKV } from "../_lib/auth";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function listPrefix(kv: KVNamespace, prefix: string, limit = 200) {
  const out: string[] = [];
  let cursor: string | undefined = undefined;

  for (let i = 0; i < 10; i++) {
    const res = await kv.list({ prefix, cursor, limit: 1000 });
    for (const k of res.keys || []) {
      out.push(k.name);
      if (out.length >= limit) break;
    }

    if ((res as any).list_complete || out.length >= limit) break;
    cursor = res.cursor;
    if (!cursor) break;
  }

  return out;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = getMetricsKV(env);
  if (!kv) return json({ ok: true, kv: false });

  const [siteKeys, lobbyKeys, gameKeys] = await Promise.all([
    listPrefix(kv, "o:site:"),
    listPrefix(kv, "o:lobby:"),
    listPrefix(kv, "o:game:"),
  ]);

  function extractIds(keys: string[], area: string) {
    return keys.map(k => k.replace(`o:${area}:`, ""));
  }

  const site = extractIds(siteKeys, "site");
  const lobby = extractIds(lobbyKeys, "lobby");
  const game = extractIds(gameKeys, "game");

  return json({
    ok: true,
    kv: true,
    online: {
      site,
      lobby,
      game,
      total: site.length + lobby.length + game.length,
    },
  });
};
