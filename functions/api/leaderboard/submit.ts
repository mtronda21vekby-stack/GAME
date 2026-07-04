import {
  calculateLeaderboardScore,
  currentSeasonId,
  ensureLeaderboardSchema,
  getLeaderboardDb,
  json,
  normalizeRunInput,
  publicRun,
  validateRun,
  type LeaderboardRunRecord,
  type LeaderboardRunInput
} from "./_shared";

const SUBMIT_COOLDOWN_MS = 60_000;

export const onRequestOptions = async () => json({ ok: true });

export const onRequestPost = async ({ request, env }: any) => {
  const db = getLeaderboardDb(env || {});
  if (!db) {
    return json({ ok: false, error: "leaderboard_database_not_connected" }, { status: 503 });
  }

  await ensureLeaderboardSchema(db);

  let body: LeaderboardRunInput;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const run = normalizeRunInput(body || {});
  const lastSubmit = await db.prepare(
    `SELECT created_at FROM leaderboard_runs
     WHERE player_id = ? AND id NOT LIKE 'live_%'
     ORDER BY created_at DESC
     LIMIT 1`
  ).bind(run.playerId).first<{ created_at: number }>();

  const createdAt = Date.now();
  const cooldownRemaining = lastSubmit?.created_at ? SUBMIT_COOLDOWN_MS - (createdAt - lastSubmit.created_at) : 0;
  if (cooldownRemaining > 0) {
    return json({
      ok: false,
      error: "submit_cooldown",
      retryAfterSeconds: Math.ceil(cooldownRemaining / 1000)
    }, { status: 429 });
  }

  const seasonId = currentSeasonId();
  const score = calculateLeaderboardScore(run);
  const reasons = validateRun(run);
  const flagged = reasons.length ? 1 : 0;
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
    `UPDATE leaderboard_runs
     SET nickname = ?
     WHERE player_id = ? AND nickname != ?`
  ).bind(run.nickname, run.playerId, run.nickname).run();

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
    `SELECT COUNT(*) + 1 AS rank FROM (
       SELECT player_id, MAX(score) AS best_score
       FROM leaderboard_runs
       WHERE season_id = ? AND board = 'world' AND flagged = 0
       GROUP BY player_id
       HAVING best_score > ?
     )`
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
