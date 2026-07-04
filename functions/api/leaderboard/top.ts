import { currentSeasonId, getLeaderboardDb, json, publicRun, type LeaderboardRunRecord } from "./_shared";

export const onRequestOptions = async () => json({ ok: true });

export const onRequestGet = async ({ request, env }: any) => {
  const db = getLeaderboardDb(env || {});
  if (!db) {
    return json({ ok: false, error: "LEADERBOARD_DB binding is not configured.", seasonId: currentSeasonId(), rows: [] }, { status: 503 });
  }

  const url = new URL(request.url);
  const seasonId = url.searchParams.get("season") || currentSeasonId();
  const board = url.searchParams.get("board") || "world";
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 100)));

  const result = await db.prepare(
    `SELECT * FROM leaderboard_runs
     WHERE season_id = ? AND board = ? AND flagged = 0
     ORDER BY score DESC, created_at ASC
     LIMIT ?`
  ).bind(seasonId, board, limit).all<LeaderboardRunRecord>();

  const rows = (result.results || []).map((row, index) => publicRun(row, index + 1));
  return json({ ok: true, seasonId, board, rows, updatedAt: Date.now() });
};
