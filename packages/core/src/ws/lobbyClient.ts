export type LobbyPlayer = { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number };
export type LobbyChatMsg = { id: string; at: number; fromId: string; fromName: string; text: string };

type Handlers = {
  onHello?: (m: { t: "hello"; room: string; clientId: string; serverTime: number; you: LobbyPlayer; players: LobbyPlayer[]; history: LobbyChatMsg[] }) => void;
  onPlayers?: (m: { t: "players"; players: LobbyPlayer[] }) => void;
  onChat?: (m: { t: "chat"; msg: LobbyChatMsg }) => void;
  onError?: (m: { t: "error"; code: string; message: string }) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return Date.now();
}

const ROOM_STATE = new Map<
  string,
  {
    players: LobbyPlayer[];
    history: LobbyChatMsg[];
  }
>();

function getRoom(room: string) {
  const key = room || "main";
  const st = ROOM_STATE.get(key);
  if (st) return st;
  const next = { players: [] as LobbyPlayer[], history: [] as LobbyChatMsg[] };
  ROOM_STATE.set(key, next);
  return next;
}

/**
 * MOCK transport:
 * - Работает в рамках одной вкладки/страницы (in-memory).
 * - Нужен, чтобы UI/архитектура жили и билдились.
 * - Онлайн подключим позже отдельным модулем.
 */
export function createLobbyClient(room: string, handlers: Handlers) {
  const r = room || "main";
  const state = getRoom(r);

  const clientId = uid();
  const you: LobbyPlayer = { id: clientId, name: "Игрок", ready: false, joinedAt: now(), lastSeen: now() };

  // connect
  queueMicrotask(() => {
    handlers.onOpen?.();
    state.players = [...state.players, you].slice(0, 8);
    handlers.onHello?.({
      t: "hello",
      room: r,
      clientId,
      serverTime: now(),
      you,
      players: state.players,
      history: state.history.slice(-40),
    });
    handlers.onPlayers?.({ t: "players", players: state.players });
  });

  const broadcastPlayers = () => {
    handlers.onPlayers?.({ t: "players", players: state.players });
  };

  return {
    close() {
      // disconnect
      const idx = state.players.findIndex((p) => p.id === clientId);
      if (idx >= 0) state.players.splice(idx, 1);
      handlers.onClose?.();
    },
    join(name: string) {
      const n = (name || "").trim() || "Игрок";
      const p = state.players.find((x) => x.id === clientId);
      if (!p) return;
      p.name = n.slice(0, 18);
      p.lastSeen = now();
      broadcastPlayers();
    },
    setReady(ready: boolean) {
      const p = state.players.find((x) => x.id === clientId);
      if (!p) return;
      p.ready = !!ready;
      p.lastSeen = now();
      broadcastPlayers();
    },
    chat(text: string) {
      const t = (text || "").trim();
      if (!t) return;
      const p = state.players.find((x) => x.id === clientId);
      if (!p) return;

      const msg: LobbyChatMsg = {
        id: uid(),
        at: now(),
        fromId: p.id,
        fromName: p.name,
        text: t.slice(0, 180),
      };
      state.history = [...state.history, msg].slice(-40);
      handlers.onChat?.({ t: "chat", msg });
    },
  };
}
