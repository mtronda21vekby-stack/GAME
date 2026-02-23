export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const kv = env.BC_METRICS_KV;
  if (!kv) return json({ ok: false, reason: "KV binding missing" }, 500);

  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "get";

  // app = site | lobby | game (или любое)
  const app = (url.searchParams.get("app") || "site").toLowerCase();

  // UTC day key
  const day = utcDayKey(); // e.g. 2026-02-23

  try {
    if (request.method === "POST" && action === "event") {
      const body = await safeJson(request);
      const type = String(body?.type || "event");
      const name = String(body?.name || type);

      await pushEvent(kv, { app, day, name, at: Date.now() });
      return json({ ok: true });
    }

    if (request.method === "POST" && action === "heartbeat") {
      // heartbeat от клиента раз в N секунд
      const ttl = clampInt(url.searchParams.get("ttl"), 30, 600, 90);
      const user = String(url.searchParams.get("user") || "anon");
      await heartbeat(kv, { app, user, ttl });
      return json({ ok: true });
    }

    if (request.method === "POST" && action === "unique") {
      // уникальный визит на сутки (UTC)
      const user = String(url.searchParams.get("user") || "anon");
      const isNew = await markUnique(kv, { app, day, user });
      return json({ ok: true, isNew });
    }

    // GET metrics summary
    if (request.method === "GET" && action === "get") {
      const [onlineTotal, onlineByApp, uniqueTotal, uniqueByApp, events] =
        await Promise.all([
          onlineCountTotal(kv),
          onlineCountByApp(kv),
          uniqueCountTotal(kv, day),
          uniqueCountByApp(kv, day),
          getEvents(kv, day),
        ]);

      return json({
        ok: true,
        kv: "ON",
        day,
        updatedAt: new Date().toISOString(),
        online: { total: onlineTotal, byApp: onlineByApp },
        unique: { total: uniqueTotal, byApp: uniqueByApp },
        eventsLast24h: events,
      });
    }

    return json({ ok: false, reason: "Unsupported action" }, 400);
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
};

type Env = { BC_METRICS_KV: KVNamespace };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function safeJson(req: Request) {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function utcDayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampInt(v: string | null, min: number, max: number, def: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/**
 * ONLINE: heartbeats
 * Ключи: online:<app>:<user> = "1" с TTL
 */
async function heartbeat(
  kv: KVNamespace,
  p: { app: string; user: string; ttl: number },
) {
  await kv.put(`online:${p.app}:${p.user}`, "1", { expirationTtl: p.ttl });
}

/**
 * UNIQUE per UTC day:
 * Ключ: uniq:<day>:<app>:<user> = "1" (TTL 2 дня)
 */
async function markUnique(
  kv: KVNamespace,
  p: { app: string; day: string; user: string },
) {
  const key = `uniq:${p.day}:${p.app}:${p.user}`;
  const existed = await kv.get(key);
  if (existed) return false;
  await kv.put(key, "1", { expirationTtl: 172800 });
  return true;
}

/**
 * EVENTS (last 24h, упрощённо храним список в одном key на день)
 * Ключ: ev:<day> = JSON массив (обрезаем до лимита)
 */
async function pushEvent(
  kv: KVNamespace,
  ev: { app: string; day: string; name: string; at: number },
) {
  const key = `ev:${ev.day}`;
  const raw = await kv.get(key);
  const arr: any[] = raw ? safeParseArray(raw) : [];
  arr.push({ app: ev.app, name: ev.name, at: ev.at });
  // ограничим размер (чтобы не раздувать KV)
  const sliced = arr.slice(-200);
  await kv.put(key, JSON.stringify(sliced), { expirationTtl: 172800 });
}

function safeParseArray(raw: string) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function getEvents(kv: KVNamespace, day: string) {
  const raw = await kv.get(`ev:${day}`);
  return raw ? safeParseArray(raw) : [];
}

async function onlineCountByApp(kv: KVNamespace) {
  // В KV list() лимитировано, но для старта ок.
  const apps = ["site", "lobby", "game"];
  const out: Record<string, number> = {};
  for (const app of apps) {
    let cursor: string | undefined;
    let count = 0;
    do {
      const res = await kv.list({ prefix: `online:${app}:`, cursor });
      count += res.keys.length;
      cursor = res.list_complete ? undefined : res.cursor;
    } while (cursor);
    out[app] = count;
  }
  return out;
}

async function onlineCountTotal(kv: KVNamespace) {
  const byApp = await onlineCountByApp(kv);
  return Object.values(byApp).reduce((a, b) => a + b, 0);
}

async function uniqueCountByApp(kv: KVNamespace, day: string) {
  const apps = ["site", "lobby", "game"];
  const out: Record<string, number> = {};
  for (const app of apps) {
    let cursor: string | undefined;
    let count = 0;
    do {
      const res = await kv.list({ prefix: `uniq:${day}:${app}:`, cursor });
      count += res.keys.length;
      cursor = res.list_complete ? undefined : res.cursor;
    } while (cursor);
    out[app] = count;
  }
  return out;
}

async function uniqueCountTotal(kv: KVNamespace, day: string) {
  const byApp = await uniqueCountByApp(kv, day);
  return Object.values(byApp).reduce((a, b) => a + b, 0);
}
