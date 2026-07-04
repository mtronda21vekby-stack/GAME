import { cleanString, ensureLeaderboardSchema, getLeaderboardDb, json } from "./_shared";

function positiveInt(value: unknown, fallback = 0, max = 1_000_000) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(max, n));
}

async function ensurePresenceSchema(db: ReturnType<typeof getLeaderboardDb>) {
  if (!db) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard_presence (
    player_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    level INTEGER NOT NULL,
    mass INTEGER NOT NULL,
    kills INTEGER NOT NULL,
    world_id TEXT,
    skin_id TEXT,
    form TEXT,
    updated_at INTEGER NOT NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_leaderboard_presence_updated ON leaderboard_presence (updated_at DESC)`).run();
}

export const onRequestOptions = async () => json({ ok: true });

export const onRequestPost = async ({ request, env }: any) => {
  const db = getLeaderboardDb(env || {});
  if (!db) return json({ ok: false, error: "leaderboard_database_not_connected" }, { status: 503 });

  await ensureLeaderboardSchema(db);
  await ensurePresenceSchema(db);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (body?.isAlive === false) return json({ ok: true, skipped: true });

  const playerId = cleanString(body?.playerId, "local-player", 64);
  const nickname = cleanString(body?.nickname, "Player", 18);
  const level = positiveInt(body?.level, 1, 999);
  const mass = positiveInt(body?.mass, 1, 1_000_000);
  const kills = positiveInt(body?.kills, 0, 100_000);
  const worldId = cleanString(body?.worldId, "main_ocean", 32);
  const skinId = cleanString(body?.skinId, "default", 48);
  const form = cleanString(body?.form, "fish", 24);
  const updatedAt = Date.now();

  await db.prepare(
    `INSERT INTO leaderboard_presence (player_id, nickname, level, mass, kills, world_id, skin_id, form, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       nickname = excluded.nickname,
       level = excluded.level,
       mass = excluded.mass,
       kills = excluded.kills,
       world_id = excluded.world_id,
       skin_id = excluded.skin_id,
       form = excluded.form,
       updated_at = excluded.updated_at`
  ).bind(playerId, nickname, level, mass, kills, worldId, skinId, form, updatedAt).run();

  return json({ ok: true, onlineWindowSeconds: 90 });
};
