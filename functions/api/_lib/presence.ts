// functions/api/_lib/presence.ts

type Scope = "site" | "lobby";

type SeenMap = Map<string, number>;

const state: Record<Scope, { online: SeenMap; seen24h: SeenMap }> = {
  site: { online: new Map(), seen24h: new Map() },
  lobby: { online: new Map(), seen24h: new Map() },
};

function nowMs() {
  return Date.now();
}

function clampScope(s: unknown): Scope {
  return s === "lobby" ? "lobby" : "site";
}

function cleanup(scope: Scope) {
  const t = nowMs();
  const onlineCut = t - 90_000; // 90s
  const dayCut = t - 24 * 60 * 60 * 1000;

  const o = state[scope].online;
  for (const [k, last] of o.entries()) {
    if (last < onlineCut) o.delete(k);
  }

  const d = state[scope].seen24h;
  for (const [k, last] of d.entries()) {
    if (last < dayCut) d.delete(k);
  }
}

export function presencePing(input: { scope?: unknown; id?: unknown }) {
  const scope = clampScope(input.scope);
  const id = String(input.id || "").trim();
  if (!id) return { ok: false as const, reason: "bad_id" };

  const t = nowMs();

  state[scope].online.set(id, t);
  state[scope].seen24h.set(id, t);

  cleanup(scope);

  return { ok: true as const };
}

export function presenceStats() {
  // чистим оба scope при чтении
  cleanup("site");
  cleanup("lobby");

  return {
    ts: nowMs(),
    site: {
      onlineNow: state.site.online.size,
      unique24h: state.site.seen24h.size,
    },
    lobby: {
      onlineNow: state.lobby.online.size,
      unique24h: state.lobby.seen24h.size,
    },
  };
}
