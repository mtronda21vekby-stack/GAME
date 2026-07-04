import type { NextEngineState, NextEngineStats } from "../core/engineTypes";
import { loadEvoFishNextSave } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";
import {
  getLeaderboardPlayerId,
  leaderboardSubmitCooldownSeconds,
  markLeaderboardSubmitAttempt,
  EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY,
  EVOFISH_LEADERBOARD_PLAYER_ID_KEY,
  EVOFISH_LEADERBOARD_SUBMIT_COOLDOWN_MS
} from "./leaderboardIdentity";

export { getLeaderboardPlayerId, leaderboardSubmitCooldownSeconds, EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY, EVOFISH_LEADERBOARD_PLAYER_ID_KEY, EVOFISH_LEADERBOARD_SUBMIT_COOLDOWN_MS };

export type LeaderboardRunPayload = {
  playerId: string;
  nickname: string;
  level: number;
  tier: number;
  maxMass: number;
  kills: number;
  bossKills: number;
  artifacts: number;
  darkCaveCleared: boolean;
  survivalSeconds: number;
  skinId: string;
  form: string;
};

export type LeaderboardRow = LeaderboardRunPayload & {
  rank?: number;
  id: string;
  seasonId: string;
  board: string;
  score: number;
  createdAt: number;
};

export type LeaderboardTopResponse = {
  ok: boolean;
  error?: string;
  seasonId?: string;
  board?: string;
  rows?: LeaderboardRow[];
  updatedAt?: number;
};

export type LeaderboardMeResponse = {
  ok: boolean;
  error?: string;
  seasonId?: string;
  rank?: number | null;
  best?: LeaderboardRow | null;
};

export type LeaderboardSeasonResponse = {
  ok: boolean;
  season?: {
    id: string;
    title: string;
    endsAt: string;
    refreshSeconds: number;
  };
};

export type LeaderboardOnlineResponse = {
  ok: boolean;
  error?: string;
  online?: number;
  players?: Array<{
    playerId: string;
    nickname: string;
    level: number;
    mass: number;
    kills: number;
    worldId: string | null;
    skinId: string | null;
    form: string | null;
    updatedAt: number;
  }>;
};

export function getLeaderboardNickname() {
  const save = loadEvoFishNextSave();
  return save.account.name || "Player";
}

export function buildLeaderboardPayloadFromEngine(engine: NextEngineState): LeaderboardRunPayload {
  const player = engine.player;
  const stats: NextEngineStats = engine.stats;
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
    form: player.form
  };
}

export function buildLeaderboardPayloadFromSave(): LeaderboardRunPayload {
  const save = loadEvoFishNextSave();
  return {
    playerId: getLeaderboardPlayerId(),
    nickname: save.account.name || "Player",
    level: save.progress.level,
    tier: save.progress.tier,
    maxMass: Math.floor(Math.max(save.progress.mass, save.account.bestMass || 1)),
    kills: Math.max(save.progress.kills || 0, save.account.lastRunKills || 0),
    bossKills: Math.max(0, Math.floor(save.quests.counters?.bosses || 0)),
    artifacts: Math.max(0, Math.floor(save.quests.counters?.artifacts || 0)),
    darkCaveCleared: Boolean(save.quests.completed?.dark_cave_return),
    survivalSeconds: 60,
    skinId: save.loadout.equippedSkinId,
    form: save.progress.form
  };
}

function withCacheBust(url: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}_=${Date.now()}`;
}

async function requestJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withCacheBust(url), {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "cache-control": "no-cache, no-store, must-revalidate",
      pragma: "no-cache",
      ...(init?.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: data?.error || response.statusText, retryAfterSeconds: data?.retryAfterSeconds } as T;
  return data as T;
}

export async function fetchLeaderboardSeason() {
  return requestJSON<LeaderboardSeasonResponse>("/api/leaderboard/season");
}

export async function fetchLeaderboardTop(limit = 100) {
  return requestJSON<LeaderboardTopResponse>(`/api/leaderboard/top?limit=${limit}`);
}

export async function fetchLeaderboardMe() {
  const playerId = encodeURIComponent(getLeaderboardPlayerId());
  return requestJSON<LeaderboardMeResponse>(`/api/leaderboard/me?playerId=${playerId}`);
}

export async function fetchLeaderboardOnline() {
  return requestJSON<LeaderboardOnlineResponse>("/api/leaderboard/online");
}

export async function submitLeaderboardRun(payload: LeaderboardRunPayload) {
  const cooldown = leaderboardSubmitCooldownSeconds();
  if (cooldown > 0) {
    return { ok: false, error: "submit_cooldown", retryAfterSeconds: cooldown, rank: null, flagged: false, run: null };
  }

  markLeaderboardSubmitAttempt({ ok: true, queued: true }, payload);
  const result = await requestJSON<{ ok: boolean; error?: string; retryAfterSeconds?: number; rank?: number | null; flagged?: boolean; run?: LeaderboardRow | null }>("/api/leaderboard/submit", {
    method: "POST",
    body: JSON.stringify({ ...payload, version: EVOFISH_NEXT_VERSION })
  });
  markLeaderboardSubmitAttempt(result, payload);
  return result;
}
