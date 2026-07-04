import { calculateLeaderboardScore, cleanString, currentSeasonId, ensureLeaderboardSchema, getLeaderboardDb, json, normalizeRunInput } from "./_shared";

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
  const tier = positiveInt(body?.tier, 1, 99);
  const mass = positiveInt(body?.mass || body?.maxMass, 1, 1_000_000);
  const maxMass = positiveInt(body?.maxMass || body?.mass, mass, 1_000_000);
  const kills = positiveInt(body?.kills, 0, 100_000);
  const bossKills = positiveInt(body?.bossKills, 0, 1_000);
  const artifacts = positiveInt(body?.artifacts, 0, 99);
  const survivalSeconds = positiveInt(body?.survivalSeconds, 20, 86_400);
  const worldId = cleanString(body?.worldId, "main_ocean", 32);
  const skinId = cleanString(body?.skinId, "default", 48);
  const form = cleanString(body?.form, "fish", 24);
  const darkCaveCleared = Boolean(body?.darkCaveCleared || worldId === "dark_cave");
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

  const seasonId = currentSeasonId();
  const liveRun = normalizeRunInput({
    playerId,
    nickname,
    level,
    tier,
    maxMass,
    kills,
    bossKills,
    artifacts,
    darkCaveCleared,
    survivalSeconds,
    skinId,
    form
  });
  const score = calculateLeaderboardScore(liveRun);
  const liveRunId = `live_${seasonId}_${playerId}`;

  await db.prepare(
    `INSERT INTO leaderboard_runs (
      id, player_id, nickname, season_id, board, score, level, tier, max_mass, kills,
      boss_kills, artifacts, dark_cave_cleared, survival_seconds, skin_id, form, flagged, flag_reason, created_at
    ) VALUES (?, ?, ?, ?, 'world', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)
    ON CONFLICT(id) DO UPDATE SET
      nickname = excluded.nickname,
      score = CASE WHEN excluded.score > leaderboard_runs.score THEN excluded.score ELSE leaderboard_runs.score END,
      level = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.level ELSE leaderboard_runs.level END,
      tier = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.tier ELSE leaderboard_runs.tier END,
      max_mass = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.max_mass ELSE leaderboard_runs.max_mass END,
      kills = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.kills ELSE leaderboard_runs.kills END,
      boss_kills = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.boss_kills ELSE leaderboard_runs.boss_kills END,
      artifacts = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.artifacts ELSE leaderboard_runs.artifacts END,
      dark_cave_cleared = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.dark_cave_cleared ELSE leaderboard_runs.dark_cave_cleared END,
      survival_seconds = CASE WHEN excluded.score >= leaderboard_runs.score THEN excluded.survival_seconds ELSE leaderboard_runs.survival_seconds END,
      skin_id = excluded.skin_id,
      form = excluded.form,
      created_at = excluded.created_at`
  ).bind(
    liveRunId,
    liveRun.playerId,
    liveRun.nickname,
    seasonId,
    score,
    liveRun.level,
    liveRun.tier,
    liveRun.maxMass,
    liveRun.kills,
    liveRun.bossKills,
    liveRun.artifacts,
    liveRun.darkCaveCleared ? 1 : 0,
    liveRun.survivalSeconds,
    liveRun.skinId,
    liveRun.form,
    updatedAt
  ).run();

  return json({ ok: true, onlineWindowSeconds: 90, liveScore: score, nickname });
};
