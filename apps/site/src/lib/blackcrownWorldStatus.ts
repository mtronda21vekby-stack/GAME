export type BlackCrownStatusTone = "cyan" | "orange" | "violet" | "green" | "neutral";

export type BlackCrownWorldStatus = {
  slug: string;
  displayName: string;
  status: string;
  tone: BlackCrownStatusTone;
  summary: string;
  sortOrder: number;
  updatedAt: string;
};

export type BlackCrownWorldStatusMap = Record<string, BlackCrownWorldStatus>;
export type BlackCrownWorldStatusSource = "supabase" | "cache" | "fallback";

export type BlackCrownWorldStatusSnapshot = {
  statuses: BlackCrownWorldStatusMap;
  source: BlackCrownWorldStatusSource;
  syncedAt: number | null;
};

type SupabaseWorldStatusRow = {
  slug?: unknown;
  display_name?: unknown;
  status?: unknown;
  tone?: unknown;
  summary?: unknown;
  sort_order?: unknown;
  updated_at?: unknown;
};

type CachedWorldStatusPayload = {
  version: 1;
  syncedAt: number;
  rows: BlackCrownWorldStatus[];
};

// Publishable anon credentials are intentionally safe for browser use. RLS keeps
// this table read-only for anonymous and authenticated visitors.
const SUPABASE_URL = "https://amgawrjomwgnvzttotve.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZ2F3cmpvbXdnbnZ6dHRvdHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDA3NzEsImV4cCI6MjA5MjM3Njc3MX0.a9gifTda5RV7Vr4Jx43-7ictc95her89wHyjksq9XVI";
const CACHE_KEY = "bc.world-status.v1";
const REQUEST_TIMEOUT_MS = 4500;

const FALLBACK_ROWS: BlackCrownWorldStatus[] = [
  {
    slug: "evofish",
    displayName: "EvoFish",
    status: "LIVE",
    tone: "cyan",
    summary: "Океанский мир доступен.",
    sortOrder: 10,
    updatedAt: "",
  },
  {
    slug: "crown-front",
    displayName: "CROWN//FRONT",
    status: "ALPHA",
    tone: "orange",
    summary: "Мобильная WebGL alpha доступна.",
    sortOrder: 20,
    updatedAt: "",
  },
  {
    slug: "blackcrown-network",
    displayName: "BlackCrown Network",
    status: "LIVE",
    tone: "green",
    summary: "Платформа работает штатно.",
    sortOrder: 30,
    updatedAt: "",
  },
];

function rowsToMap(rows: BlackCrownWorldStatus[]): BlackCrownWorldStatusMap {
  return rows.reduce<BlackCrownWorldStatusMap>((result, row) => {
    result[row.slug] = row;
    return result;
  }, {});
}

export const BLACKCROWN_WORLD_STATUS_FALLBACK = rowsToMap(FALLBACK_ROWS);

function isTone(value: unknown): value is BlackCrownStatusTone {
  return value === "cyan" || value === "orange" || value === "violet" || value === "green" || value === "neutral";
}

function normalizeRow(row: SupabaseWorldStatusRow): BlackCrownWorldStatus | null {
  if (typeof row.slug !== "string" || !row.slug) return null;
  if (typeof row.display_name !== "string" || !row.display_name) return null;
  if (typeof row.status !== "string" || !row.status) return null;

  return {
    slug: row.slug,
    displayName: row.display_name,
    status: row.status,
    tone: isTone(row.tone) ? row.tone : "neutral",
    summary: typeof row.summary === "string" ? row.summary : "",
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

function readCachedRows(): CachedWorldStatusPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedWorldStatusPayload>;
    if (parsed.version !== 1 || typeof parsed.syncedAt !== "number" || !Array.isArray(parsed.rows)) return null;

    const rows = parsed.rows.filter((row): row is BlackCrownWorldStatus => {
      return Boolean(row && typeof row.slug === "string" && typeof row.status === "string");
    });

    return rows.length > 0 ? { version: 1, syncedAt: parsed.syncedAt, rows } : null;
  } catch {
    return null;
  }
}

function writeCachedRows(rows: BlackCrownWorldStatus[], syncedAt: number) {
  if (typeof window === "undefined") return;

  try {
    const payload: CachedWorldStatusPayload = { version: 1, syncedAt, rows };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable in privacy mode; the live request still works.
  }
}

function createEndpoint() {
  const endpoint = new URL(`${SUPABASE_URL}/rest/v1/blackcrown_world_status`);
  endpoint.searchParams.set("select", "slug,display_name,status,tone,summary,sort_order,updated_at");
  endpoint.searchParams.set("is_visible", "eq.true");
  endpoint.searchParams.set("order", "sort_order.asc");
  return endpoint.toString();
}

export async function loadBlackCrownWorldStatuses(signal?: AbortSignal): Promise<BlackCrownWorldStatusSnapshot> {
  const cached = readCachedRows();
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(createEndpoint(), {
      method: "GET",
      headers: {
        accept: "application/json",
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`World status request failed: ${response.status}`);

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) throw new Error("World status response is not an array");

    const rows = payload
      .map((row) => normalizeRow((row ?? {}) as SupabaseWorldStatusRow))
      .filter((row): row is BlackCrownWorldStatus => row !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    if (rows.length === 0) throw new Error("World status response is empty");

    const syncedAt = Date.now();
    writeCachedRows(rows, syncedAt);

    return {
      statuses: rowsToMap(rows),
      source: "supabase",
      syncedAt,
    };
  } catch {
    if (cached) {
      return {
        statuses: rowsToMap(cached.rows),
        source: "cache",
        syncedAt: cached.syncedAt,
      };
    }

    return {
      statuses: BLACKCROWN_WORLD_STATUS_FALLBACK,
      source: "fallback",
      syncedAt: null,
    };
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
