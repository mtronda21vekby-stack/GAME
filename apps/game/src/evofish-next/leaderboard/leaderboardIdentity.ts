export const EVOFISH_LEADERBOARD_PLAYER_ID_KEY = "evofish_leaderboard_player_id_v1";
export const EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY = "evofish_leaderboard_last_submit_v1";
export const EVOFISH_LEADERBOARD_SUBMIT_COOLDOWN_MS = 60_000;

function randomId() {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : null;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getLeaderboardPlayerId() {
  try {
    const existing = localStorage.getItem(EVOFISH_LEADERBOARD_PLAYER_ID_KEY);
    if (existing) return existing;
    const id = `ef_${randomId()}`;
    localStorage.setItem(EVOFISH_LEADERBOARD_PLAYER_ID_KEY, id);
    return id;
  } catch {
    return "ef_private_mode";
  }
}

export function leaderboardSubmitCooldownSeconds() {
  try {
    const raw = localStorage.getItem(EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { at?: string; attemptAt?: number };
    const last = parsed.at ? new Date(parsed.at).getTime() : Number(parsed.attemptAt || 0);
    if (!Number.isFinite(last) || last <= 0) return 0;
    const remaining = EVOFISH_LEADERBOARD_SUBMIT_COOLDOWN_MS - (Date.now() - last);
    return Math.max(0, Math.ceil(remaining / 1000));
  } catch {
    return 0;
  }
}

export function markLeaderboardSubmitAttempt(result?: unknown, payload?: unknown) {
  try {
    localStorage.setItem(EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY, JSON.stringify({
      at: new Date().toISOString(),
      attemptAt: Date.now(),
      result,
      payload
    }));
  } catch {
    // optional local anti-spam marker only
  }
}
