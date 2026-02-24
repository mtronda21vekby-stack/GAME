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

function clampText(s: string, max = 180) {
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
  return `bc_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getClientId(): string {
  try {
    const k = "bc.lobby.clientId.v1";
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = safeId();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return safeId();
  }
}

type LobbyStatus = "connecting" | "online" | "offline";

type Player = {
  id: string;
  name: string;
  ready: boolean;
  joinedAt?: number;
  lastSeen?: number;
};

type ChatMsg = {
  id: string;
  from: string;
  text: string;
  t: number;
  local?: boolean;
};

type WsServerHello = {
  t: "hello";
  room: string;
  clientId: string;
  serverTime: number;
  seq: number;
  match?: any;
  you?: Player;
  players?: Player[];
  history?: { id: string; at: number; fromId: string; fromName: string; text: string }[];
};

type WsServerPlayers = {
  t: "players";
  seq: number;
  serverTime: number;
  match?: any;
  players: Player[];
};

type WsServerChat = {
  t: "chat";
  seq: number;
  serverTime: number;
  msg: { id: string; at: number; fromId: string; fromName: string; text: string };
};

type WsServerMatch = { t: "match"; seq: number; serverTime: number; match: any };
type WsServerStart = { t: "start"; seq: number; serverTime: number; matchId: string; seed: number; players: Player[] };
type WsServerError = { t: "error"; code: string; message: string };

type WsServerAny = WsServerHello | WsServerPlayers | WsServerChat | WsServerMatch | WsServerStart | WsServerError | any;

type WsClientJoin = { t: "join"; clientId?: string; name: string };
type WsClientReady = { t: "ready"; ready: boolean };
type WsClientChat = { t: "chat"; text: string; clientMsgId?: string };
type WsClientPing = { t: "ping"; at: number };

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

/**
 * ВАЖНО:
 * Если WS у тебя проксируется через Pages Functions на /api/lobby/ws — оставляем так.
 * (У тебя это уже было и “работает”)
 */
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

  const [matchLabel, setMatchLabel] = React.useState<"ожидание" | "старт" | "запущен">("ожидание");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const aliveRef = React.useRef(true);
  const joinSentRef = React.useRef(false);
  const reconnectTimerRef = React.useRef<number | null>(null);
  const attemptRef = React.useRef(0);

  const myNickRef = React.useRef(getNick());
  const clientIdRef = React.useRef<string>(getClientId());
  const desiredReadyRef = React.useRef(false);

  // CLICK FIX (iOS): фон/канвас не должен перехватывать тапы
  const ClickFix = (
    <style>{`
      /* If any fixed canvas/overlay sits on top – it kills taps on iOS. Disable it. */
      canvas,
      .MatrixBackground,
      .matrixCanvas,
      #matrix,
      .bcHeroBg,
      .bcHeroAurora,
      .bcHeroVignette,
      .bcHeroNoise {
        pointer-events: none !important;
        touch-action: none !important;
      }

      /* Ensure lobby UI is above any background */
      .bcSiteRoot,
      .bcSection,
      .glassStrong {
        position: relative;
        z-index: 2;
      }

      /* Defensive: sometimes some wrapper uses pointer-events:none */
      button, a, input {
        pointer-events: auto;
      }
    `}</style>
  );

  // keep nick fresh
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

  const sendWs = React.useCallback((msg: WsClientJoin | WsClientReady | WsClientChat | WsClientPing) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }, []);

  const scheduleReconnect = React.useCallback(() => {
    if (!aliveRef.current) return;
    if (reconnectTimerRef.current != null) return;

    const attempt = Math.min(12, attemptRef.current + 1);
    attemptRef.current = attempt;

    const backoff = Math.min(9000, 350 + attempt * 650);
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current?.();
    }, backoff) as unknown as number;
  }, []);

  const connectRef = React.useRef<(() => void) | null>(null);

  const connect = React.useCallback(() => {
    closeWs();
    setStatus("connecting");

    const url = wsUrl(room);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const doJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;

      sendWs({
        t: "join",
        clientId: clientIdRef.current,
        name: myNickRef.current,
      } satisfies WsClientJoin);

      const desired = desiredReadyRef.current;
      if (desired) {
        sendWs({ t: "ready", ready: true } satisfies WsClientReady);
      }
    };

    ws.onopen = () => {
      if (!aliveRef.current) return;
      setStatus("online");
      attemptRef.current = 0;
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
      if (!data || typeof data.t !== "string") return;

      if (data.t === "hello") {
        const h = data as WsServerHello;

        // players
        if (Array.isArray(h.players)) setPlayers(h.players.slice(0, 8));

        // history
        if (Array.isArray(h.history)) {
          const mapped: ChatMsg[] = h.history.map((m) => ({
            id: m.id,
            from: m.fromName,
            text: m.text,
            t: m.at,
          }));
          setHistory((prev) => uniqChat([...prev, ...mapped], 80));
        }

        // match label
        const ms = h.match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");

        return;
      }

      if (data.t === "players") {
        const p = data as WsServerPlayers;
        if (Array.isArray(p.players)) setPlayers(p.players.slice(0, 8));

        const ms = p.match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "match") {
        const ms = (data as WsServerMatch).match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "chat") {
        const c = data as WsServerChat;
        const m = c.msg;
        if (!m?.id) return;
        setHistory((prev) => uniqChat([...prev, { id: m.id, from: m.fromName, text: m.text, t: m.at }], 80));
        return;
      }

      if (data.t === "start") {
        // авто-вход в игру (как ты хотел)
        nav("/game/");
        return;
      }

      if (data.t === "error") {
        // не ломаем UX, но можно дернуть reconnect если rate-limit не при чем
        return;
      }
    };

    ws.onerror = () => {
      // usually followed by close
    };

    ws.onclose = () => {
      if (!aliveRef.current) return;
      setStatus("offline");
      joinSentRef.current = false;
      scheduleReconnect();
    };
  }, [room, closeWs, sendWs, scheduleReconnect]);

  connectRef.current = connect;

  // keepalive ping
  React.useEffect(() => {
    if (status !== "online") return;

    const t = window.setInterval(() => {
      if (!aliveRef.current) return;
      if (document.visibilityState !== "visible") return;
      sendWs({ t: "ping", at: Date.now() } satisfies WsClientPing);
    }, 18_000);

    return () => window.clearInterval(t);
  }, [status, sendWs]);

  // lifecycle
  React.useEffect(() => {
    aliveRef.current = true;
    connect();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const ws = wsRef.current;

      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        connect();
        return;
      }
      if (ws.readyState === WebSocket.OPEN && !joinSentRef.current) {
        joinSentRef.current = true;
        sendWs({ t: "join", clientId: clientIdRef.current, name: myNickRef.current } satisfies WsClientJoin);
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
    sendWs({ t: "ready", ready: next } satisfies WsClientReady);
  }, [canReady, isOnline, sendWs]);

  const sendChat = React.useCallback(() => {
    if (!isOnline) return;

    const msg = clampText(text, 180);
    if (!msg) return;

    setText("");

    // optimistic append
    const optimistic: ChatMsg = {
      id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
      from: myNickRef.current,
      text: msg,
      t: Date.now(),
      local: true,
    };
    setHistory((prev) => uniqChat([...prev, optimistic], 80));

    sendWs({ t: "chat", text: msg, clientMsgId: safeId() } satisfies WsClientChat);
  }, [isOnline, sendWs, text]);

  return (
    <main className="bcSiteRoot">
      {ClickFix}

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
              <div style={{ opacity: 0.75, fontWeight: 850 }}>Матч: {matchLabel}</div>
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
                      connect();
                    }}
                  >
                    Переподключить
                  </Button>

                  <Button variant="secondary" onClick={() => nav("/game/")} disabled={!isOnline}>
                    В игру
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

              <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 850, fontSize: 12, lineHeight: 1.45 }}>
                AAA v1: WebSocket (Durable Objects) + авто-reconnect + ping keepalive.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Lobby;
