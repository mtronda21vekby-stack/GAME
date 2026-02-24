/* apps/ws-lobby/src/index.ts
   BlackCrown Lobby WS (Durable Objects)
   - Stable clientId (passed from client)
   - seq + serverTime authority
   - dedupe by clientMsgId
   - match state machine (waiting -> countdown -> started)
   - rate limit chat
*/

type ServerMsg =
  | {
      t: "hello";
      room: string;
      clientId: string;
      serverTime: number;
      seq: number;
      match: MatchState;
      you: Player;
      players: Player[];
      history: ChatMsg[];
    }
  | { t: "players"; seq: number; serverTime: number; match: MatchState; players: Player[] }
  | { t: "chat"; seq: number; serverTime: number; msg: ChatMsg }
  | { t: "match"; seq: number; serverTime: number; match: MatchState }
  | { t: "start"; seq: number; serverTime: number; matchId: string; seed: number; players: Player[] }
  | { t: "error"; code: string; message: string };

type ClientMsg =
  | { t: "join"; clientId?: string; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "chat"; text: string; clientMsgId?: string }
  | { t: "ping"; at: number };

type MatchState = { s: "waiting" } | { s: "countdown"; endsAt: number } | { s: "started"; matchId: string; seed: number };

type Player = {
  id: string;
  name: string;
  ready: boolean;
  joinedAt: number;
  lastSeen: number;
};

type ChatMsg = { id: string; at: number; fromId: string; fromName: string; text: string };

const MAX_NAME = 18;
const MAX_TEXT = 180;
const HISTORY_LIMIT = 60;

const SPAM_WINDOW_MS = 2500;
const SPAM_MAX_MSG = 3;

const PING_TIMEOUT_MS = 45_000; // если нет активности — считаем отвалился
const COUNTDOWN_MS = 5000;

const json = (x: unknown) => JSON.stringify(x);

function safeName(raw: string): string {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  if (!s) return "Игрок";
  return s.slice(0, MAX_NAME);
}

function safeText(raw: string): string {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  return s.slice(0, MAX_TEXT);
}

function safeRoom(raw: string): string {
  const r = String(raw || "main").trim();
  return r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "main";
}

function safeClientId(raw: string): string {
  const s = String(raw || "").trim();
  const v = s.replace(/[^a-zA-Z0-9_\-:.]/g, "").slice(0, 96);
  return v || "";
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function okUpgrade(request: Request): boolean {
  return request.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

function roomFromUrl(url: URL): string {
  // /ws/<room> или ?room=
  const parts = url.pathname.split("/").filter(Boolean);
  const byPath = parts[0] === "ws" && parts[1] ? parts[1] : "";
  const byQuery = url.searchParams.get("room") || "";
  return safeRoom(byPath || byQuery || "main");
}

export interface Env {
  LOBBY_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") return new Response("ok", { status: 200 });

    // WebSocket entrypoint: /ws or /ws/<room>
    if (url.pathname === "/ws" || url.pathname.startsWith("/ws/")) {
      if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

      const room = roomFromUrl(url);
      const id = env.LOBBY_ROOM.idFromName(room);
      const stub = env.LOBBY_ROOM.get(id);

      const nextUrl = new URL(request.url);
      nextUrl.searchParams.set("room", room);

      return stub.fetch(new Request(nextUrl.toString(), request));
    }

    return new Response("Not found", { status: 404 });
  },
};

export class LobbyRoom {
  private state: DurableObjectState;
  private room = "main";

  private seq = 1;

  // socket -> playerId
  private sockets = new Map<WebSocket, string>();

  // playerId -> Player
  private players = new Map<string, Player>();

  private history: ChatMsg[] = [];

  // anti-spam: playerId -> timestamps[]
  private spam = new Map<string, number[]>();

  // dedupe chat per player: playerId -> set(clientMsgId)
  private dedupe = new Map<string, Set<string>>();

  private match: MatchState = { s: "waiting" };
  private countdownTimer: number | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      const saved = await this.state.storage.get<{
        seq?: number;
        players?: Player[];
        history?: ChatMsg[];
        match?: MatchState;
      }>("snapshot");

      if (typeof saved?.seq === "number" && Number.isFinite(saved.seq)) this.seq = Math.max(1, Math.floor(saved.seq));

      if (Array.isArray(saved?.players)) {
        for (const p of saved.players) this.players.set(p.id, p);
      }

      if (Array.isArray(saved?.history)) this.history = saved.history.slice(-HISTORY_LIMIT);

      if (saved?.match && typeof saved.match === "object") {
        this.match = saved.match as MatchState;
      }

      // если матч был в countdown при рестарте DO — сбросим в waiting (безопасно)
      if (this.match.s === "countdown") this.match = { s: "waiting" };

      // cleanup “мертвых” игроков (по lastSeen)
      const now = Date.now();
      for (const [id, p] of this.players) {
        if (now - (p.lastSeen || 0) > PING_TIMEOUT_MS) this.players.delete(id);
      }

      await this.persist();
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    this.room = safeRoom(url.searchParams.get("room") || this.room);

    if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    // temporary id (will be replaced on join if client provides stable clientId)
    const tempId = uid();
    this.sockets.set(server, tempId);

    const now = Date.now();
    const player: Player = {
      id: tempId,
      name: "Игрок",
      ready: false,
      joinedAt: now,
      lastSeen: now,
    };
    this.players.set(tempId, player);

    // hello
    this.send(server, this.buildHello(tempId));

    // broadcast presence
    this.broadcastPlayers();

    server.addEventListener("message", (ev) => this.onMessage(server, ev));
    server.addEventListener("close", () => this.onClose(server));
    server.addEventListener("error", () => this.onClose(server));

    return new Response(null, { status: 101, webSocket: client });
  }

  private nextSeq(): number {
    this.seq += 1;
    return this.seq;
  }

  private send(ws: WebSocket, msg: ServerMsg) {
    try {
      ws.send(json(msg));
    } catch {
      // ignore
    }
  }

  private broadcast(msg: ServerMsg) {
    for (const ws of this.sockets.keys()) this.send(ws, msg);
  }

  private sortedPlayers(): Player[] {
    return Array.from(this.players.values()).sort((a, b) => {
      // ready first, then joinedAt
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
  }

  private buildHello(playerId: string): ServerMsg {
    const now = Date.now();
    const p = this.players.get(playerId)!;
    return {
      t: "hello",
      room: this.room,
      clientId: playerId,
      serverTime: now,
      seq: this.seq,
      match: this.match,
      you: p,
      players: this.sortedPlayers(),
      history: this.history.slice(-HISTORY_LIMIT),
    };
  }

  private async persist() {
    const snap = {
      seq: this.seq,
      players: this.sortedPlayers().map((p) => ({ ...p })),
      history: this.history.slice(-HISTORY_LIMIT),
      match: this.match,
    };
    await this.state.storage.put("snapshot", snap);
  }

  private broadcastPlayers() {
    const now = Date.now();
    const seq = this.nextSeq();
    this.broadcast({ t: "players", seq, serverTime: now, match: this.match, players: this.sortedPlayers() });
    void this.persist();
  }

  private broadcastMatch() {
    const now = Date.now();
    const seq = this.nextSeq();
    this.broadcast({ t: "match", seq, serverTime: now, match: this.match });
    void this.persist();
  }

  private spamAllow(id: string, now: number): boolean {
    const arr = this.spam.get(id) || [];
    const next = arr.filter((t) => now - t <= SPAM_WINDOW_MS);
    next.push(now);
    this.spam.set(id, next);
    return next.length <= SPAM_MAX_MSG;
  }

  private dedupeAllow(id: string, clientMsgId: string): boolean {
    const key = safeClientId(clientMsgId);
    if (!key) return true;
    let s = this.dedupe.get(id);
    if (!s) {
      s = new Set<string>();
      this.dedupe.set(id, s);
    }
    if (s.has(key)) return false;
    s.add(key);
    // keep small
    if (s.size > 64) {
      const arr = Array.from(s);
      s.clear();
      for (const k of arr.slice(-40)) s.add(k);
    }
    return true;
  }

  private cleanupDead(now: number) {
    for (const [id, p] of this.players) {
      if (now - (p.lastSeen || 0) > PING_TIMEOUT_MS) {
        this.players.delete(id);
        this.spam.delete(id);
        this.dedupe.delete(id);
      }
    }
  }

  private countReady(): { total: number; ready: number } {
    const vals = Array.from(this.players.values());
    const total = vals.length;
    const ready = vals.filter((p) => p.ready).length;
    return { total, ready };
  }

  private maybeStartCountdown() {
    if (this.match.s !== "waiting") return;

    const { total, ready } = this.countReady();

    // match rules: 2..8 and all ready
    if (total >= 2 && total <= 8 && ready === total) {
      const endsAt = Date.now() + COUNTDOWN_MS;
      this.match = { s: "countdown", endsAt };
      this.broadcastMatch();

      // schedule start (single)
      if (this.countdownTimer != null) {
        clearTimeout(this.countdownTimer);
        this.countdownTimer = null;
      }

      this.countdownTimer = setTimeout(() => {
        this.countdownTimer = null;
        void this.startMatchIfStillValid();
      }, COUNTDOWN_MS) as unknown as number;
    }
  }

  private cancelCountdownIfNeeded() {
    if (this.match.s !== "countdown") return;

    const { total, ready } = this.countReady();
    if (total < 2 || ready !== total) {
      this.match = { s: "waiting" };
      if (this.countdownTimer != null) {
        clearTimeout(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.broadcastMatch();
    }
  }

  private async startMatchIfStillValid() {
    // re-check
    if (this.match.s !== "countdown") return;
    const now = Date.now();
    if (now < this.match.endsAt - 50) return;

    const { total, ready } = this.countReady();
    if (total < 2 || total > 8 || ready !== total) {
      this.match = { s: "waiting" };
      this.broadcastMatch();
      return;
    }

    const matchId = `m_${uid()}`;
    const seed = Math.floor(Math.random() * 1_000_000_000);

    this.match = { s: "started", matchId, seed };
    const seq = this.nextSeq();
    const players = this.sortedPlayers();

    this.broadcast({ t: "start", seq, serverTime: Date.now(), matchId, seed, players });
    await this.persist();

    // after start — reset readiness (safe) and return to waiting for next match
    for (const p of this.players.values()) p.ready = false;
    this.match = { s: "waiting" };
    this.broadcastPlayers();
    this.broadcastMatch();
  }

  private onMessage(ws: WebSocket, ev: MessageEvent) {
    const currentId = this.sockets.get(ws);
    if (!currentId) return;

    const now = Date.now();

    // cleanup dead
    this.cleanupDead(now);

    const p = this.players.get(currentId);
    if (!p) return;

    p.lastSeen = now;

    let data: unknown = null;
    try {
      data = typeof ev.data === "string" ? JSON.parse(ev.data) : null;
    } catch {
      this.send(ws, { t: "error", code: "bad_json", message: "Неверный формат" });
      return;
    }

    const msg = data as ClientMsg;
    if (!msg || typeof (msg as any).t !== "string") return;

    if (msg.t === "ping") {
      // light response: players/match only (no full history every ping)
      const seq = this.nextSeq();
      this.send(ws, { t: "players", seq, serverTime: now, match: this.match, players: this.sortedPlayers() });
      return;
    }

    if (msg.t === "join") {
      const wanted = safeClientId(msg.clientId || "");
      const name = safeName(msg.name);

      // if client provides stable id and it's different from temp:
      if (wanted && wanted !== currentId) {
        // migrate player record
        const existing = this.players.get(wanted);
        if (existing) {
          // if already exists, just attach this socket to existing player
          existing.name = name;
          existing.lastSeen = now;
          this.players.set(wanted, existing);
        } else {
          const migrated: Player = { ...p, id: wanted, name, lastSeen: now };
          this.players.set(wanted, migrated);
        }

        // detach old temp player
        this.players.delete(currentId);
        this.spam.delete(currentId);
        this.dedupe.delete(currentId);

        // remap socket to wanted id
        this.sockets.set(ws, wanted);

        // hello again with authoritative id
        this.send(ws, this.buildHello(wanted));
        this.broadcastPlayers();
        this.cancelCountdownIfNeeded();
        this.maybeStartCountdown();
        return;
      }

      // normal join
      p.name = name;
      p.lastSeen = now;
      this.players.set(currentId, p);

      this.send(ws, this.buildHello(currentId));
      this.broadcastPlayers();
      this.cancelCountdownIfNeeded();
      this.maybeStartCountdown();
      return;
    }

    if (msg.t === "ready") {
      p.ready = !!msg.ready;
      p.lastSeen = now;
      this.players.set(currentId, p);

      this.broadcastPlayers();
      this.cancelCountdownIfNeeded();
      this.maybeStartCountdown();
      return;
    }

    if (msg.t === "chat") {
      const text = safeText(msg.text);
      if (!text) return;

      const clientMsgId = safeClientId(msg.clientMsgId || "");
      if (!this.dedupeAllow(currentId, clientMsgId)) return;

      if (!this.spamAllow(currentId, now)) {
        this.send(ws, { t: "error", code: "rate_limited", message: "Слишком быстро" });
        return;
      }

      const chat: ChatMsg = {
        id: `c_${uid()}`,
        at: now,
        fromId: currentId,
        fromName: p.name,
        text,
      };

      this.history.push(chat);
      this.history = this.history.slice(-HISTORY_LIMIT);

      const seq = this.nextSeq();
      this.broadcast({ t: "chat", seq, serverTime: now, msg: chat });
      void this.persist();
      return;
    }
  }

  private onClose(ws: WebSocket) {
    const id = this.sockets.get(ws);
    if (!id) return;

    this.sockets.delete(ws);

    // player stays for a bit by lastSeen; but for UX — remove immediately if no sockets for that id
    // check if any socket still mapped to id
    let stillConnected = false;
    for (const v of this.sockets.values()) {
      if (v === id) {
        stillConnected = true;
        break;
      }
    }

    if (!stillConnected) {
      this.players.delete(id);
      this.spam.delete(id);
      this.dedupe.delete(id);
    }

    this.broadcastPlayers();
    this.cancelCountdownIfNeeded();
  }
}
