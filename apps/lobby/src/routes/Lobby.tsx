// apps/lobby/src/routes/Lobby.tsx
import React from "react";
import { Button } from "@blackcrown/ui";
import { userStorage } from "@blackcrown/core";

function nav(path: string) {
  window.location.assign(path);
}

function getNick() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function clampText(s: string, max = 360) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `m_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

type LobbyStatus = "connecting" | "online" | "offline";

type Player = {
  id: string;
  name: string;
  ready: boolean;
  joinedAt?: number;
};

type ChatMsg = {
  id: string;
  from: string;
  text: string;
  t: number;
  local?: boolean;
};

type WsServerState = {
  type: "state";
  players?: Player[];
  matchState?: "waiting" | "countdown" | "started";
  serverTime?: number;
};

type WsServerChat = {
  type: "chat";
  msg?: { id: string; from: string; text: string; t: number };
};

type WsServerStart = {
  type: "start";
  matchId?: string;
  seed?: number;
  players?: Player[];
  serverTime?: number;
};

type WsServerAny = WsServerState | WsServerChat | WsServerStart | { type: string; [k: string]: unknown };

type WsClientJoin = { type: "join"; name: string };
type WsClientReady = { type: "ready"; value: boolean };
type WsClientChat = { type: "chat"; text: string; clientMsgId?: string };
type WsClientAny = WsClientJoin | WsClientReady | WsClientChat | { type: string; [k: string]: unknown };

function uniqChat(items: ChatMsg[], limit = 80) {
  const seen = new Set<string>();
  const out: ChatMsg[] = [];
  for (const it of items) {
    if (!it?.id) continue;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  if (out.length > limit) return out.slice(out.length - limit);
  return out;
}

function wsUrl(roomId: string) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${proto}//${location.host}`;
  return `${base}/api/lobby/ws?room=${encodeURIComponent(roomId)}`;
}

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<LobbyStatus>("connecting");
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [history, setHistory] = React.useState<ChatMsg[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");

  const [matchState, setMatchState] = React.useState<"waiting" | "countdown" | "started">("waiting");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const aliveRef = React.useRef(true);
  const joinSentRef = React.useRef(false);
  const reconnectTimerRef = React.useRef<number | null>(null);

  const myNickRef = React.useRef(getNick());
  const desiredReadyRef = React.useRef(false);

  // keep nick fresh (account page edits)
  React.useEffect(() => {
    const sync = () => {
      myNickRef.current = getNick();
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync as any);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync as any);
    };
  }, []);

  // autoscroll chat
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const closeWs = React.useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    joinSentRef.current = false;

    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      } catch {
        // ignore
      }
    }
  }, []);

  const sendWs = React.useCallback((msg: WsClientAny) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }, []);

  const scheduleReconnect = React.useCallback(
    (attempt: number) => {
      if (!aliveRef.current) return;
      if (reconnectTimerRef.current != null) return;

      const backoff = Math.min(7000, 350 + attempt * 450);
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        // connect() is defined below; called via ref
        connectRef.current?.();
      }, backoff) as unknown as number;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const connectRef = React.useRef<(() => void) | null>(null);

  const connect = React.useCallback(() => {
    closeWs();
    setStatus("connecting");

    const url = wsUrl(room);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    let attempt = 0;

    const doJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;
      sendWs({ type: "join", name: myNickRef.current } satisfies WsClientJoin);

      // re-apply ready state if user already toggled
      const desired = desiredReadyRef.current;
      if (desired) {
        sendWs({ type: "ready", value: true } satisfies WsClientReady);
      }
    };

    ws.onopen = () => {
      if (!aliveRef.current) return;
      setStatus("online");
      attempt = 0;
      doJoin();
    };

    ws.onmessage = (ev) => {
      if (!aliveRef.current) return;

      let data: WsServerAny | null = null;
      try {
        data = JSON.parse(String(ev.data)) as WsServerAny;
      } catch {
        data = null;
      }
      if (!data || typeof data.type !== "string") return;

      if (data.type === "state") {
        const s = data as WsServerState;
        if (Array.isArray(s.players)) setPlayers(s.players.slice(0, 8));
        if (s.matchState === "waiting" || s.matchState === "countdown" || s.matchState === "started") {
          setMatchState(s.matchState);
        }
        // server is authoritative, but keep local ready consistent with our intent where possible
        // if server list contains us (same name), we can infer; otherwise keep local toggle as-is
        return;
      }

      if (data.type === "chat") {
        const c = data as WsServerChat;
        const m = c.msg;
        if (!m?.id || !m.from || !m.text || !m.t) return;

        setHistory((prev) => uniqChat([...prev, { id: m.id, from: m.from, text: m.text, t: m.t }], 80));
        return;
      }

      if (data.type === "start") {
        const st = data as WsServerStart;
        // MVP: auto-open game route (match can be used later)
        // Keep it production-safe: open /game/ without breaking existing container
        nav("/game/");
        return;
      }
    };

    ws.onerror = () => {
      // errors are followed by close in most browsers
    };

    ws.onclose = () => {
      if (!aliveRef.current) return;
      setStatus("offline");
      joinSentRef.current = false;
      attempt += 1;
      scheduleReconnect(attempt);
    };
  }, [room, closeWs, sendWs, scheduleReconnect]);

  connectRef.current = connect;

  // lifecycle
  React.useEffect(() => {
    aliveRef.current = true;
    connect();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      // if offline, reconnect immediately
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        connect();
        return;
      }
      // ensure join exists
      if (ws.readyState === WebSocket.OPEN) {
        if (!joinSentRef.current) {
          joinSentRef.current = true;
          sendWs({ type: "join", name: myNickRef.current } satisfies WsClientJoin);
        }
      }
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      aliveRef.current = false;
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
      closeWs();
    };
  }, [connect, closeWs, sendWs]);

  const onlineCount = players.length;
  const canReady = onlineCount <= 8;
  const isOnline = status === "online";

  const toggleReady = React.useCallback(() => {
    if (!canReady) return;

    const next = !desiredReadyRef.current;
    desiredReadyRef.current = next;
    setReady(next);

    if (!isOnline) return;
    sendWs({ type: "ready", value: next } satisfies WsClientReady);
  }, [canReady, isOnline, sendWs]);

  const sendChat = React.useCallback(() => {
    if (!isOnline) return;

    const msg = clampText(text);
    if (!msg) return;

    setText("");

    // optimistic append (local id is unique and will not duplicate server ids)
    const optimistic: ChatMsg = {
      id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
      from: myNickRef.current,
      text: msg,
      t: Date.now(),
      local: true,
    };
    setHistory((prev) => uniqChat([...prev, optimistic], 80));

    sendWs({ type: "chat", text: msg, clientMsgId: safeId() } satisfies WsClientChat);
  }, [isOnline, sendWs, text]);

  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 14 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            className="glassStrong"
            style={{
              borderRadius: 22,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 980 }}>Lobby</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Комната: {room}</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Игроки: {onlineCount}/8</div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>
                Статус: {status === "online" ? "онлайн" : status === "connecting" ? "подключение" : "офлайн"}
              </div>
              <div style={{ opacity: 0.75, fontWeight: 850 }}>
                Матч: {matchState === "waiting" ? "ожидание" : matchState === "countdown" ? "старт" : "запущен"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => nav("/game/")}>
                Игры
              </Button>
              <Button variant="ghost" onClick={() => nav("/")}>
                Главная
              </Button>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "grid", gap: 12 }}>
            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 950 }}>Игроки</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant={ready ? "primary" : "secondary"} onClick={toggleReady} disabled={!isOnline || !canReady}>
                    {ready ? "Готов" : "Не готов"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      // hard reconnect (useful if user’s network is weird)
                      connect();
                    }}
                  >
                    Переподключить
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {players.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 10,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{p.name}</div>
                    <div style={{ opacity: 0.78, fontWeight: 900 }}>{p.ready ? "ready" : "…"}</div>
                  </div>
                ))}
              </div>

              {!canReady ? (
                <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 850, lineHeight: 1.45 }}>Комната заполнена.</div>
              ) : null}
            </div>

            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 950 }}>Чат</div>
                <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>{isOnline ? "live" : "offline"}</div>
              </div>

              <div
                ref={listRef}
                style={{
                  marginTop: 10,
                  height: 280,
                  overflow: "auto",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.16)",
                  padding: 10,
                }}
              >
                {history.map((m) => (
                  <div key={m.id} style={{ padding: "6px 0", display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 950 }}>{m.from}</div>
                      <div style={{ opacity: 0.68, fontWeight: 850, fontSize: 12 }}>{fmtTime(m.t)}</div>
                    </div>
                    <div style={{ opacity: 0.88, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                  </div>
                ))}
                {history.length === 0 ? <div style={{ opacity: 0.72, fontWeight: 850 }}>Сообщений пока нет.</div> : null}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={isOnline ? "Написать сообщение" : "Чат офлайн"}
                  disabled={!isOnline}
                  onKeyDown={(e) => {
                    if (!isOnline) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  style={{
                    flex: "1 1 240px",
                    height: 44,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text)",
                    padding: "0 12px",
                    outline: "none",
                    fontWeight: 850,
                    opacity: isOnline ? 1 : 0.65,
                  }}
                />

                <Button variant="primary" onClick={sendChat} disabled={!isOnline}>
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Lobby;
