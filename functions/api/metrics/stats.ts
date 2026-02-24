// functions/api/metrics/stats.ts
import { Env, getMetricsKV } from "../_lib/auth";

function dayUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function hourUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${dd}-${hh}`;
}

async function countPrefix(kv: KVNamespace, prefix: string): Promise<number> {
  let cursor: string | undefined = undefined;
  let total = 0;

  for (let i = 0; i < 25; i++) {
    const res = await kv.list({ prefix, cursor, limit: 1000 });
    total += res.keys?.length || 0;

    // ✅ правильный критерий окончания
    if ((res as any).list_complete === true) break;

    cursor = res.cursor;
    if (!cursor) break;
  }

  return total;
}

async function collectEventsLast24h(kv: KVNamespace) {
  const now = new Date();
  const hours: string[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    hours.push(hourUTC(d));
  }

  const byApp: { site: Record<string, number>; lobby: Record<string, number>; game: Record<string, number> } = {
    site: {},
    lobby: {},
    game: {},
  };
  const total: Record<string, number> = {};

  for (const h of hours) {
    let cursor: string | undefined = undefined;

    for (let page = 0; page < 10; page++) {
      const res = await kv.list({ prefix: `e:${h}:`, cursor, limit: 1000 });

      for (const k of res.keys || []) {
        const key = k.name; // e:YYYY-MM-DD-HH:app:name
        const parts = key.split(":");
        if (parts.length < 4) continue;
        const app = parts[2] as "site" | "lobby" | "game";
        const name = parts.slice(3).join(":");
        const vRaw = await kv.get(key);
        const v = Number(vRaw || "0") || 0;
        if (!v) continue;

        const bucket = byApp[app];
        bucket[name] = (bucket[name] || 0) + v;
        total[name] = (total[name] || 0) + v;
      }

      if ((res as any).list_complete === true) break;

      cursor = res.cursor;
      if (!cursor) break;
    }
  }

  return { kv: true, byApp, total };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = getMetricsKV(env);
  if (!kv) {
    return new Response(
      JSON.stringify({
        ok: true,
        stats: {
          kv: false,
          online: { site: 0, lobby: 0, game: 0 },
          uniqueDay: { site: 0, lobby: 0, game: 0 },
          onlineTotal: 0,
          uniqueDayTotal: 0,
        },
        events24h: { kv: false, byApp: { site: {}, lobby: {}, game: {} }, total: {} },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const d = dayUTC();

  const [oSite, oLobby, oGame, uSite, uLobby, uGame] = await Promise.all([
    countPrefix(kv, "o:site:"),
    countPrefix(kv, "o:lobby:"),
    countPrefix(kv, "o:game:"),
    countPrefix(kv, `u:${d}:site:`),
    countPrefix(kv, `u:${d}:lobby:`),
    countPrefix(kv, `u:${d}:game:`),
  ]);

  const events24h = await collectEventsLast24h(kv);

  const stats = {
    kv: true,
    online: { site: oSite, lobby: oLobby, game: oGame },
    uniqueDay: { site: uSite, lobby: uLobby, game: uGame },
    onlineTotal: oSite + oLobby + oGame,
    uniqueDayTotal: uSite + uLobby + uGame,
  };

  return new Response(JSON.stringify({ ok: true, stats, events24h }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
