import { platformGames } from "../../lib/platformGames";

export const SPATIAL_CATEGORIES = ["Все игры", "Экшн", "Исследование", "Симуляторы"] as const;
export type SpatialReturn = { worldIndex: number; category: string; scrollY: number };
const KEY = "blackcrownSpatialReturn";
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

/** UI state belongs to this browser history entry, separate from account/game storage. */
export function readSpatialReturn(state: unknown, pathname: string): SpatialReturn | undefined {
  if (!isRecord(state) || !isRecord(state[KEY])) return;
  const saved = state[KEY];
  if (saved.pathname !== pathname || typeof saved.scrollY !== "number" || !Number.isFinite(saved.scrollY) || saved.scrollY < 0) return;
  const category = SPATIAL_CATEGORIES.find(value => value === saved.category);
  const worldIndex = platformGames.findIndex(game => game.id === saved.gameId);
  if (!category || worldIndex < 0 || (category !== "Все игры" && platformGames[worldIndex].genre !== category)) return;
  return { worldIndex, category, scrollY: saved.scrollY };
}

export function rememberSpatialReturn(history: Pick<History, "state" | "replaceState">, pathname: string, view: SpatialReturn) {
  if ((history.state !== null && !isRecord(history.state)) || !platformGames[view.worldIndex]) return;
  try {
    history.replaceState({ ...history.state, [KEY]: { pathname, gameId: platformGames[view.worldIndex].id, category: view.category, scrollY: view.scrollY } }, "");
  } catch { /* A history restriction must not interrupt navigation. */ }
}
