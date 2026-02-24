export type BlockRow = {
  id: string;
  kind: string;
  title?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export type ContentPayload = { blocks: BlockRow[] };

type CacheEntry = { at: number; data: ContentPayload };

const LS_KEY = "bc.content.cache.v1";
const MAX_AGE_MS = 60_000; // 60s: быстро обновляется, но не долбит сеть

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.data?.blocks) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: ContentPayload) {
  try {
    const entry: CacheEntry = { at: Date.now(), data };
    localStorage.setItem(LS_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export async function fetchContent(opts?: { force?: boolean; signal?: AbortSignal }): Promise<ContentPayload> {
  const force = !!opts?.force;

  const cached = readCache();
  if (!force && cached && Date.now() - cached.at < MAX_AGE_MS) {
    return cached.data;
  }

  const res = await fetch("/api/content", {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) {
    // fallback to cache if present
    if (cached?.data) return cached.data;
    throw new Error("content_load_failed");
  }

  const data = (await res.json()) as ContentPayload;
  if (!data?.blocks) {
    if (cached?.data) return cached.data;
    return { blocks: [] };
  }

  writeCache(data);
  return data;
}
