import { ensureLeaderboardSchema, getLeaderboardDb, json } from "./_shared";

type PresenceRow = {
  player_id: string;
  nickname: string;
  level: number;
  mass: number;
  kills: number;
  world_id: string | null;
  skin_id: string | null;
  form: string | null;
  updated_at: number;
};

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

export const onRequestGet = async ({ request, env }: any) => {
  const db = getLeaderboardDb(env || {});
  if (!db) return json({ ok: false, error: "leaderboard_database_not_connected", online: 0, players: [] }, { status: 503 });

  await ensureLeaderboardSchema(db);
  await ensurePresenceSchema(db);

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 12)));
  const since = Date.now() - 90_000;

  const result = await db.prepare(
    `SELECT * FROM leaderboard_presence
     WHERE updated_at >= ?
     ORDER BY updated_at DESC
     LIMIT ?`
  ).bind(since, limit).all<PresenceRow>();

  const count = await db.prepare(
    `SELECT COUNT(*) AS online FROM leaderboard_presence WHERE updated_at >= ?`
  ).bind(since).first<{ online: number }>();

  const players = (result.results || []).map((row) => ({
    playerId: row.player_id,
    nickname: row.nickname,
    level: row.level,
    mass: row.mass,
    kills: row.kills,
    worldId: row.world_id,
    skinId: row.skin_id,
    form: row.form,
    updatedAt: row.updated_at
  }));

  return json({ ok: true, online: count?.online || players.length, players, updatedAt: Date.now() });
};
