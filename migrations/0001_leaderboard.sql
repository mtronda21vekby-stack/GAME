-- EvoFish online leaderboard schema for Cloudflare D1.
-- Bind this database in Cloudflare Pages as LEADERBOARD_DB.

CREATE TABLE IF NOT EXISTS leaderboard_runs (
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
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_runs_top
ON leaderboard_runs (season_id, board, flagged, score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_runs_player
ON leaderboard_runs (season_id, player_id, score DESC);

CREATE TABLE IF NOT EXISTS leaderboard_players (
  player_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_run_id TEXT,
  total_runs INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
