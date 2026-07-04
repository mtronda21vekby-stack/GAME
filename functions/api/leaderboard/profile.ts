import { cleanString, ensureLeaderboardSchema, getLeaderboardDb, json } from "./_shared";

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

  const playerId = cleanString(body?.playerId, "local-player", 64);
  const nickname = cleanString(body?.nickname, "Player", 18);
  const updatedAt = Date.now();

  await db.prepare(
    `INSERT INTO leaderboard_players (player_id, nickname, best_score, best_run_id, total_runs, updated_at)
     VALUES (?, ?, 0, NULL, 0, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       nickname = excluded.nickname,
       updated_at = excluded.updated_at`
  ).bind(playerId, nickname, updatedAt).run();

  await db.prepare(
    `UPDATE leaderboard_runs
     SET nickname = ?
     WHERE player_id = ? AND nickname != ?`
  ).bind(nickname, playerId, nickname).run();

  await db.prepare(
    `UPDATE leaderboard_presence
     SET nickname = ?, updated_at = ?
     WHERE player_id = ?`
  ).bind(nickname, updatedAt, playerId).run();

  return json({ ok: true, playerId, nickname });
};
