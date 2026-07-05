import type { NextEngineState } from "../core/engineTypes";
import { EVOFISH_NEXT_VERSION } from "../version";
import { getLeaderboardPlayerId, leaderboardSubmitCooldownSeconds, markLeaderboardSubmitAttempt } from "./leaderboardIdentity";

const LIVE_HEARTBEAT_MS = 5_000;

type RuntimeLeaderboardState = NextEngineState & {
  leaderboardSubmittedForRun?: boolean;
  leaderboardHeartbeatAt?: number;
};

function runStatsFromEngine(engine: NextEngineState) {
  const player = engine.player;
  const stats = engine.stats;
  return {
    playerId: getLeaderboardPlayerId(),
    nickname: engine.account.name || "Player",
    level: Math.max(1, Math.floor(player.level || stats.level || 1)),
    tier: Math.max(1, Math.floor(player.tier || stats.tier || 1)),
    maxMass: Math.max(1, Math.floor(player.mass || stats.mass || 1)),
    kills: Math.max(0, Math.floor(stats.kills || 0)),
    bossKills: Math.max(0, Math.floor(engine.quests.counters?.bosses || 0)),
    artifacts: Math.max(0, Math.floor(stats.artifactsFound || engine.quests.counters?.artifacts || 0)),
    darkCaveCleared: Boolean(engine.story.completed?.dark_cave_return || engine.worldId === "dark_cave"),
    survivalSeconds: Math.max(20, Math.floor(engine.frame / 60)),
    skinId: player.skin.id,
    form: player.form,
    version: EVOFISH_NEXT_VERSION
  };
}

function payloadFromEngine(engine: NextEngineState) {
  return runStatsFromEngine(engine);
}

function heartbeatPayload(engine: NextEngineState) {
  return {
    ...runStatsFromEngine(engine),
    mass: Math.max(1, Math.floor(engine.player.mass || engine.stats.mass || 1)),
    worldId: engine.worldId,
    isAlive: !engine.player.dead && !engine.player.downed
  };
}

async function postJSON(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json", "cache-control": "no-cache, no-store, must-revalidate" },
    body: JSON.stringify(body)
  });
  return response.json().catch(() => ({ ok: response.ok }));
}

export function syncLeaderboardForEngine(engine: NextEngineState) {
  const runtime = engine as RuntimeLeaderboardState;
  const now = Date.now();
  const isFinished = Boolean(engine.player.dead || engine.player.downed);

  if (!isFinished && (!runtime.leaderboardHeartbeatAt || now - runtime.leaderboardHeartbeatAt >= LIVE_HEARTBEAT_MS)) {
    runtime.leaderboardHeartbeatAt = now;
    postJSON("/api/leaderboard/heartbeat", heartbeatPayload(engine)).catch(() => {});
  }

  if (!isFinished || runtime.leaderboardSubmittedForRun) return;
  runtime.leaderboardSubmittedForRun = true;

  const cooldown = leaderboardSubmitCooldownSeconds();
  if (cooldown > 0) return;

  const payload = payloadFromEngine(engine);
  markLeaderboardSubmitAttempt({ ok: true, automatic: true, queued: true }, payload);
  postJSON("/api/leaderboard/submit", payload)
    .then((result) => markLeaderboardSubmitAttempt({ ...(result as object), automatic: true }, payload))
    .catch(() => {});
}
