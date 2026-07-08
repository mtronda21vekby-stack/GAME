const PAUSE_KEY = "evofish_next_runtime_pause_v1";

type PauseState = Record<string, boolean>;

function readPauseState(): PauseState {
  try {
    const raw = localStorage.getItem(PAUSE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePauseState(state: PauseState) {
  try {
    localStorage.setItem(PAUSE_KEY, JSON.stringify(state));
  } catch {
    // runtime pause is optional in private mode
  }
}

export function setEvoFishPauseSource(source: string, paused: boolean) {
  if (typeof localStorage === "undefined") return;
  const key = String(source || "unknown");
  const state = readPauseState();
  if (paused) state[key] = true;
  else delete state[key];
  writePauseState(state);
}

export function isEvoFishRuntimePaused() {
  if (typeof localStorage === "undefined") return false;
  return Object.values(readPauseState()).some(Boolean);
}
