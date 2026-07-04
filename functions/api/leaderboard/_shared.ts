type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = unknown>() => Promise<T | null>;
      all: <T = unknown>() => Promise<{ results?: T[] }>;
      run: () => Promise<unknown>;
    };
    first: <T = unknown>() => Promise<T | null>;
    all: <T = unknown>() => Promise<{ results?: T[] }>;
    run: () => Promise<unknown>;
  };
};

export type LeaderboardRunInput = {
  playerId?: string;
  nickname?: string;
  level?: number;
  tier?: number;
  maxMass?: number;
  kills?: number;
  bossKills?: number;
  artifacts?: number;
  darkCaveCleared?: boolean;
  survivalSeconds?: number;
  skinId?: string;
  form?: string;
};

export type LeaderboardRunRecord = {
  id: string;
  player_id: string;
  nickname: string;
  season_id: string;
  board: string;
  score: number;
  level: number;
  tier: number;
  max_mass: number;
  kills: number;
  boss_kills: number;
  artifacts: number;
  dark_cave_cleared: number;
  survival_seconds: number;
  skin_id: string | null;
  form: string | null;
  flagged: number;
  flag_reason: string | null;
  created_at: number;
};

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      ...(init.headers || {})
    }
  });
}

export function getLeaderboardDb(env: Record<string, unknown>): D1DatabaseLike | null {
  return (env.LEADERBOARD_DB || env.DB || env.LOBBY_DB || null) as D1DatabaseLike | null;
}

export async function ensureLeaderboardSchema(db: D1DatabaseLike) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard_runs (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    season_id TEXT NOT NULL,
    board TEXT NOT NULL DEFAULT 'world',
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    tier INTEGER NOT NULL DEFAULT 1,
    max_mass INTEGER NOT NULL,
    kills INTEGER NOT NULL,
    boss_kills INTEGER NOT NULL DEFAULT 0,
    artifacts INTEGER NOT NULL DEFAULT 0,
    dark_cave_cleared INTEGER NOT NULL DEFAULT 0,
    survival_seconds INTEGER NOT NULL,
    skin_id TEXT,
    form TEXT,
    flagged INTEGER NOT NULL DEFAULT 0,
    flag_reason TEXT,
    created_at INTEGER NOT NULL
  )`).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_leaderboard_runs_top
    ON leaderboard_runs (season_id, board, flagged, score DESC, created_at ASC)`).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_leaderboard_runs_player
    ON leaderboard_runs (season_id, player_id, score DESC)`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard_players (
    player_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    best_score INTEGER NOT NULL DEFAULT 0,
    best_run_id TEXT,
    total_runs INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`).run();
}

export function currentSeasonId(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `season_${date.getUTCFullYear()}_w${String(week).padStart(2, "0")}`;
}

export function seasonEndsAt(now = new Date()) {
  const end = new Date(now);
  const day = end.getUTCDay() || 7;
  const daysUntilMonday = 8 - day;
  end.setUTCDate(end.getUTCDate() + daysUntilMonday);
  end.setUTCHours(0, 0, 0, 0);
  return end.toISOString();
}

export function cleanString(value: unknown, fallback: string, max = 24) {
  const clean = String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return clean || fallback;
}

function positiveInt(value: unknown, fallback = 0, max = 1000000) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(max, n));
}

export function normalizeRunInput(input: LeaderboardRunInput) {
  const level = positiveInt(input.level, 1, 999);
  const tier = positiveInt(input.tier, 1, 99);
  const maxMass = positiveInt(input.maxMass, 1, 1000000);
  const kills = positiveInt(input.kills, 0, 100000);
  const bossKills = positiveInt(input.bossKills, 0, 1000);
  const artifacts = positiveInt(input.artifacts, 0, 99);
  const survivalSeconds = positiveInt(input.survivalSeconds, 1, 86400);

  return {
    playerId: cleanString(input.playerId, "local-player", 64),
    nickname: cleanString(input.nickname, "Player", 18),
    level,
    tier,
    maxMass,
    kills,
    bossKills,
    artifacts,
    darkCaveCleared: Boolean(input.darkCaveCleared),
    survivalSeconds,
    skinId: cleanString(input.skinId, "default", 48),
    form: cleanString(input.form, "fish", 24)
  };
}

export function calculateLeaderboardScore(run: ReturnType<typeof normalizeRunInput>) {
  return Math.max(0,
    run.level * 100 +
    run.tier * 35 +
    run.kills * 12 +
    run.bossKills * 650 +
    run.artifacts * 320 +
    Math.floor(run.maxMass * 7) +
    Math.floor(run.survivalSeconds * 1.5) +
    (run.darkCaveCleared ? 2500 : 0)
  );
}

export function validateRun(run: ReturnType<typeof normalizeRunInput>) {
  const reasons: string[] = [];
  if (run.survivalSeconds < 20 && run.level > 8) reasons.push("level too high for short run");
  if (run.kills > run.survivalSeconds * 4 + 30) reasons.push("kills too high for duration");
  if (run.level > 300) reasons.push("level exceeds beta cap");
  if (run.maxMass > 250000) reasons.push("mass exceeds beta cap");
  return reasons;
}

export function publicRun(row: LeaderboardRunRecord, rank?: number) {
  return {
    rank,
    id: row.id,
    playerId: row.player_id,
    nickname: row.nickname,
    seasonId: row.season_id,
    board: row.board,
    score: row.score,
    level: row.level,
    tier: row.tier,
    maxMass: row.max_mass,
    kills: row.kills,
    bossKills: row.boss_kills,
    artifacts: row.artifacts,
    darkCaveCleared: Boolean(row.dark_cave_cleared),
    survivalSeconds: row.survival_seconds,
    skinId: row.skin_id,
    form: row.form,
    createdAt: row.created_at
  };
}
