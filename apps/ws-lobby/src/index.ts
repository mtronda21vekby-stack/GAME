/* src/index.ts
   BlackCrown Lobby WS (Durable Object) — Production Safe, AAA upgrades
*/

type ServerMsg =
  | {
      t: "hello";
      room: string;
      clientId: string;
      serverTime: number;
      you: Player;
      players: Player[];
      history: ChatMsg[];
      // optional fields for future
      v?: number;
    }
  | { t: "players"; players: Player[] }
  | { t: "chat"; msg: ChatMsg }
  | { t: "error"; code: string; message: string };

type ClientMsg =
  | { t: "join"; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "chat"; text: string }
  | { t: "ping"; at: number };

type Player = { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number };
type ChatMsg = { id: string; at: number; fromId: string; fromName: string; text: string };

const MAX_NAME = 18;
const MAX_TEXT = 180;
const HISTORY_LIMIT = 40;

// spam control
const SPAM_WINDOW_MS = 2500;
const SPAM_MAX_MSG = 3;

// presence control
const PRESENCE_IDLE_MS = 70_000; // after this, player is removed
const ALARM_EVERY_MS = 12_000;

// snapshot keys
const SNAP_KEY = "snapshot_v2";

const json = (x: unknown) => JSON.stringify(x);

function safeName(raw: string): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  if (!s) return "Игрок";
  return s.slice(0, MAX_NAME);
}

function safeText(raw: string): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  return s.slice(0, MAX_TEXT);
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function okUpgrade(request: Request): boolean {
  return request.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

function safeRoom(raw: string): string {
  const r = (raw || "").trim();
  const cleaned = r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return cleaned || "main";
}

function safeClientId(raw: string): string {
  const r = (raw || "").trim();
  const cleaned = r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned;
}

function roomFromUrl(url: URL): string {
  // /ws/<room> or ?room=
  const parts = url.pathname.split("/").filter(Boolean);
  const byPath = parts[0] === "ws" && parts[1] ? parts[1] : "";
  const byQuery = url.searchParams.get("room") || "";
  return safeRoom(byPath || byQuery || "main");
}

function clientIdFromUrl(url: URL): string {
  // optional: ?cid=<stable client id>
  // if not provided, server generates one per connection (works, but no reconnect continuity)
  const cid = url.searchParams.get("cid") || url.searchParams.get("clientId") || "";
  return safeClientId(cid);
}

export interface Env {
  LOBBY_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") return new Response("ok", { status: 200 });

    if (url.pathname.startsWith("/ws")) {
      if (!okUpgrade(request)) return new Response("Expected WebSocket", { status: 426 });

      const room = roomFromUrl(url);
      const id = env.LOBBY_ROOM.idFromName(room);
      const stub = env.LOBBY_ROOM.get(id);

      // forward room + optional clientId for continuity
      const nextUrl = new URL(request.url);
      nextUrl.searchParams.set("room", room);

      // keep cid if present
      const cid = clientIdFromUrl(url);
      if (cid) nextUrl.searchParams.set("cid", cid);

      return stub.fetch(new Request(nextUrl.toString(), request));
    }

    return new Response("Not found", { status: 404 });
  },
};

type Snapshot = {
  room: string;
  history: ChatMsg[];
  // players are ephemeral, but we keep last known state to reduce cold-start flicker
  players: Player[];
};

export class LobbyRoom {
  private state: DurableObjectState;
  private room: string = "main";

  // socket <-> clientId (1 active socket per clientId)
  private sockets = new Map<WebSocket, string>();
  private socketByClient = new Map<string, WebSocket>();

  private players = new Map<string, Player>();
  private history: ChatMsg[] = [];

  private spam = new Map<string, number[]>();
  private recentChatIds = new Set<string>(); // simple dedupe
  private alarmArmed = false;

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      const saved = await this.state.storage.get<Snapshot>(SNAP_KEY);
      if (saved?.history?.length) this.history = saved.history.slice(-HISTORY_LIMIT);
      if (saved?.players?.length) {
        // restore as baseline, but they’ll be swept if stale
        for (const p of saved.players) {
          if (p?.id) this.players.set(p.id, p);
        }
      }
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

    const now = Date.now();
    const providedCid = clientIdFromUrl(url);
    const clientId = providedCid || uid();

    // enforce single socket per clientId: close old one if exists
    const old = this.socketByClient.get(clientId);
    if (old && old !== server) {
      try {
        old.close(1000, "replaced");
      } catch {}
      this.sockets.delete(old);
    }

    this.sockets.set(server, clientId);
    this.socketByClient.set(clientId, server);

    // player baseline (restore if exists)
    const existing = this.players.get(clientId);
    const player: Player = existing
      ? { ...existing, lastSeen: now }
      : { id: clientId, name: "Игрок", ready: false, joinedAt: now, lastSeen: now };

    this.players.set(clientId, player);

    // hello snapshot
    this.send(server, {
      t: "hello",
      v: 2,
      room: this.room,
      clientId,
      serverTime: now,
      you: player,
      players: this.sortedPlayers(),
      history: this.history.slice(-HISTORY_LIMIT),
    });

    // broadcast players (so others see you instantly)
    this.broadcastPlayers();

    server.addEventListener("message", (ev) => this.onMessage(server, ev));
    server.addEventListener("close", () => this.onClose(server));
    server.addEventListener("error", () => this.onClose(server));

    // arm sweeper alarm
    this.armAlarm(now);

    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    // periodic sweep for stale players and dead sockets
    const now = Date.now();

    let changed = false;

    for (const [cid, p] of this.players.entries()) {
      const last = Number(p?.lastSeen || 0);
      if (!last || now - last > PRESENCE_IDLE_MS) {
        // close socket if still mapped
        const ws = this.socketByClient.get(cid);
        if (ws) {
          try {
            ws.close(1000, "idle_timeout");
          } catch {}
          this.sockets.delete(ws);
          this.socketByClient.delete(cid);
        }
        this.players.delete(cid);
        this.spam.delete(cid);
        changed = true;
      }
    }

    if (changed) this.broadcastPlayers();

    // re-arm
    this.alarmArmed = false;
    this.armAlarm(now);
  }

  private armAlarm(now: number) {
    if (this.alarmArmed) return;
    this.alarmArmed = true;
    try {
      this.state.storage.setAlarm(now + ALARM_EVERY_MS);
    } catch {
      // ignore
    }
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
    // stable ordering: join order, but also keep ready users together if you want later
    return Array.from(this.players.values()).sort((a, b) => a.joinedAt - b.joinedAt);
  }

  private async persist() {
    // snapshot small & safe
    const snap: Snapshot = {
      room: this.room,
      history: this.history.slice(-HISTORY_LIMIT),
      players: this.sortedPlayers().map((p) => ({ ...p })),
    };
    await this.state.storage.put(SNAP_KEY, snap);
  }

  private broadcastPlayers() {
    this.broadcast({ t: "players", players: this.sortedPlayers() });
    void this.persist();
  }

  private spamAllow(id: string, now: number): boolean {
    const arr = this.spam.get(id) || [];
    const next = arr.filter((t) => now - t <= SPAM_WINDOW_MS);
    next.push(now);
    this.spam.set(id, next);
    return next.length <= SPAM_MAX_MSG;
  }

  private onMessage(ws: WebSocket, ev: MessageEvent) {
    const id = this.sockets.get(ws);
    if (!id) return;

    const p = this.players.get(id);
    if (!p) return;

    const now = Date.now();
    p.lastSeen = now;
    this.players.set(id, p);
    this.armAlarm(now);

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
      // lightweight pong via hello-compatible message (keeps your client safe)
      this.send(ws, {
        t: "hello",
        v: 2,
        room: this.room,
        clientId: id,
        serverTime: now,
        you: p,
        players: this.sortedPlayers(),
        history: [], // IMPORTANT: не шлём историю на каждый ping
      });
      return;
    }

    if (msg.t === "join") {
      const nextName = safeName(msg.name);
      if (p.name !== nextName) {
        p.name = nextName;
        this.players.set(id, p);
        this.broadcastPlayers();
      }
      return;
    }

    if (msg.t === "ready") {
      const nextReady = !!msg.ready;
      if (p.ready !== nextReady) {
        p.ready = nextReady;
        this.players.set(id, p);
        this.broadcastPlayers();
      }
      return;
    }

    if (msg.t === "chat") {
      const text = safeText(msg.text);
      if (!text) return;

      if (!this.spamAllow(id, now)) {
        this.send(ws, { t: "error", code: "rate_limited", message: "Слишком быстро" });
        return;
      }

      const chat: ChatMsg = {
        id: uid(),
        at: now,
        fromId: id,
        fromName: p.name,
        text,
      };

      // server-side dedupe (paranoia)
      if (this.recentChatIds.has(chat.id)) return;
      this.recentChatIds.add(chat.id);
      if (this.recentChatIds.size > 400) {
        // avoid unbounded growth
        const it = this.recentChatIds.values().next();
        if (!it.done) this.recentChatIds.delete(it.value);
      }

      this.history.push(chat);
      if (this.history.length > HISTORY_LIMIT) this.history = this.history.slice(-HISTORY_LIMIT);

      this.broadcast({ t: "chat", msg: chat });
      void this.persist();
      return;
    }
  }

  private onClose(ws: WebSocket) {
    const id = this.sockets.get(ws);
    if (!id) return;

    this.sockets.delete(ws);

    const mapped = this.socketByClient.get(id);
    if (mapped === ws) this.socketByClient.delete(id);

    // IMPORTANT: не удаляем игрока сразу — даём шанс на быструю переподключку
    // Он уйдет по PRESENCE_IDLE_MS через alarm sweep, если не вернется.
    this.broadcastPlayers();
  }
}
