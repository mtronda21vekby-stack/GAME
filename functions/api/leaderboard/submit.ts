import {
  calculateLeaderboardScore,
  currentSeasonId,
  getLeaderboardDb,
  json,
  normalizeRunInput,
  publicRun,
  validateRun,
  type LeaderboardRunRecord,
  type LeaderboardRunInput
} from "./_shared";

export const onRequestOptions = async () => json({ ok: true });

export const onRequestPost = async ({ request, env }: any) => {
  const db = getLeaderboardDb(env || {});
  if (!db) {
    return json({ ok: false, error: "LEADERBOARD_DB binding is not configured." }, { status: 503 });
  }

  let body: LeaderboardRunInput;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const run = normalizeRunInput(body || {});
  const seasonId = currentSeasonId();
  const score = calculateLeaderboardScore(run);
  const reasons = validateRun(run);
  const flagged = reasons.length ? 1 : 0;
  const createdAt = Date.now();
  const runId = `run_${createdAt}_${crypto.randomUUID()}`;

  await db.prepare(
    `INSERT INTO leaderboard_runs (
      id, player_id, nickname, season_id, board, score, level, tier, max_mass, kills,
      boss_kills, artifacts, dark_cave_cleared, survival_seconds, skin_id, form, flagged, flag_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    runId,
    run.playerId,
    run.nickname,
    seasonId,
    "world",
    score,
    run.level,
    run.tier,
    run.maxMass,
    run.kills,
    run.bossKills,
    run.artifacts,
    run.darkCaveCleared ? 1 : 0,
    run.survivalSeconds,
    run.skinId,
    run.form,
    flagged,
    reasons.join(", ") || null,
    createdAt
  ).run();

  await db.prepare(
    `INSERT INTO leaderboard_players (player_id, nickname, best_score, best_run_id, total_runs, updated_at)
     VALUES (?, ?, ?, ?, 1, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       nickname = excluded.nickname,
       best_score = CASE WHEN excluded.best_score > leaderboard_players.best_score THEN excluded.best_score ELSE leaderboard_players.best_score END,
       best_run_id = CASE WHEN excluded.best_score > leaderboard_players.best_score THEN excluded.best_run_id ELSE leaderboard_players.best_run_id END,
       total_runs = leaderboard_players.total_runs + 1,
       updated_at = excluded.updated_at`
  ).bind(run.playerId, run.nickname, score, runId, createdAt).run();

  const row = await db.prepare(
    `SELECT COUNT(*) + 1 AS rank FROM leaderboard_runs
     WHERE season_id = ? AND board = 'world' AND flagged = 0 AND score > ?`
  ).bind(seasonId, score).first<{ rank: number }>();

  const record = await db.prepare(`SELECT * FROM leaderboard_runs WHERE id = ?`).bind(runId).first<LeaderboardRunRecord>();

  return json({
    ok: true,
    flagged: Boolean(flagged),
    flagReasons: reasons,
    rank: flagged ? null : row?.rank || null,
    run: record ? publicRun(record, flagged ? undefined : row?.rank || undefined) : null
  });
};
