import { currentSeasonId, ensureLeaderboardSchema, getLeaderboardDb, json, publicRun, type LeaderboardRunRecord } from "./_shared";

export const onRequestOptions = async () => json({ ok: true });

export const onRequestGet = async ({ request, env }: any) => {
  const db = getLeaderboardDb(env || {});
  if (!db) {
    return json({ ok: false, error: "leaderboard_database_not_connected", seasonId: currentSeasonId(), best: null }, { status: 503 });
  }

  await ensureLeaderboardSchema(db);

  const url = new URL(request.url);
  const playerId = url.searchParams.get("playerId") || "";
  const seasonId = url.searchParams.get("season") || currentSeasonId();
  if (!playerId) return json({ ok: false, error: "playerId is required." }, { status: 400 });

  const best = await db.prepare(
    `SELECT * FROM leaderboard_runs
     WHERE season_id = ? AND board = 'world' AND player_id = ? AND flagged = 0
     ORDER BY score DESC, created_at ASC
     LIMIT 1`
  ).bind(seasonId, playerId).first<LeaderboardRunRecord>();

  if (!best) return json({ ok: true, seasonId, best: null, rank: null });

  const rank = await db.prepare(
    `SELECT COUNT(*) + 1 AS rank FROM (
       SELECT player_id, MAX(score) AS best_score
       FROM leaderboard_runs
       WHERE season_id = ? AND board = 'world' AND flagged = 0
       GROUP BY player_id
       HAVING best_score > ?
     )`
  ).bind(seasonId, best.score).first<{ rank: number }>();

  return json({ ok: true, seasonId, rank: rank?.rank || null, best: publicRun(best, rank?.rank || undefined) });
};
