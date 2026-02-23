-- D1 schema (MVP)

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT,
  data TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  ekey TEXT,
  amount INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  dedupe_key TEXT NOT NULL,
  UNIQUE(user_id, dedupe_key)
);

-- (MVP: блоки можно создать из /admin, поэтому seed не обязателен)
