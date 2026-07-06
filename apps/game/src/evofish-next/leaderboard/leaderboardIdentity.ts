export const EVOFISH_LEADERBOARD_PLAYER_ID_KEY = "evofish_leaderboard_player_id_v1";
export const EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY = "evofish_leaderboard_last_submit_v1";
export const EVOFISH_LEADERBOARD_SUBMIT_EVENT = "evofish_leaderboard_submit_changed";
export const EVOFISH_LEADERBOARD_SUBMIT_COOLDOWN_MS = 60_000;

function randomId() {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : null;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function safeScope(scope?: string) {
  return String(scope || "main").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "main";
}

function scopedKey(base: string, scope?: string) {
  return `${base}__${safeScope(scope)}`;
}

export function getLeaderboardPlayerId(scope?: string) {
  const key = scopedKey(EVOFISH_LEADERBOARD_PLAYER_ID_KEY, scope);
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `ef_${safeScope(scope)}_${randomId()}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `ef_private_mode_${safeScope(scope)}`;
  }
}

export function leaderboardSubmitCooldownSeconds(scope?: string) {
  try {
    const raw = localStorage.getItem(scopedKey(EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY, scope));
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

export function markLeaderboardSubmitAttempt(result?: unknown, payload?: unknown, scope?: string) {
  const entry = {
    at: new Date().toISOString(),
    attemptAt: Date.now(),
    result,
    payload
  };

  try {
    localStorage.setItem(scopedKey(EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY, scope), JSON.stringify(entry));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVOFISH_LEADERBOARD_SUBMIT_EVENT, { detail: entry }));
  } catch {
    // optional local anti-spam marker only
  }
}
