# EvoFish Online Leaderboard Setup

This is the minimal production path for the online seasonal leaderboard.

## Important

The game code can create tables automatically, but it cannot create a Cloudflare D1 database or attach a Pages binding by itself. That must exist in the Cloudflare project environment.

## 1. Create Cloudflare D1 database

Create a D1 database in Cloudflare, then bind it to the Cloudflare Pages project as:

```text
LEADERBOARD_DB
```

Do not add the D1 binding to `wrangler.toml` unless the real production database id is known. This project keeps Cloudflare Pages bindings in the dashboard to avoid broken deploys from placeholder bindings.

## 2. Schema

The Functions API auto-creates the required tables on first request when `LEADERBOARD_DB` is bound.

The SQL is still kept here for manual setup or inspection:

```text
migrations/0001_leaderboard.sql
```

It creates:

- `leaderboard_runs`
- `leaderboard_players`
- indexes for top 100 and per-player lookup

## 3. API endpoints

```text
GET  /api/leaderboard/season
GET  /api/leaderboard/top
GET  /api/leaderboard/me?playerId=...
POST /api/leaderboard/submit
```

## 4. Client routes

```text
/game/leaderboard
/game/next/leaderboard
/next/leaderboard
```

The public home screen links to `/game/leaderboard`.

## 5. Score formula

Score is calculated server-side in `functions/api/leaderboard/_shared.ts`:

```text
level * 100
+ tier * 35
+ kills * 12
+ bossKills * 650
+ artifacts * 320
+ maxMass * 7
+ survivalSeconds * 1.5
+ darkCaveCleared bonus
```

## 6. Basic anti-cheat

The server flags suspicious runs:

- impossible level for very short runs;
- too many kills for duration;
- level above beta cap;
- mass above beta cap.

Flagged runs are stored but hidden from public top 100.
