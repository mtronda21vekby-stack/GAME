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

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `l_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

type LobbyUser = { clientId: string; nick: string; ready: boolean; seenAt: number };
type LobbyStateResp = { ok: boolean; kv?: boolean; roomId?: string; users?: LobbyUser[] };

type ChatItem = { id: string; t: number; nick: string; text: string };
type ChatResp = { ok: boolean; kv?: boolean; roomId?: string; items?: ChatItem[]; serverTime?: number };

async function postHeartbeat(payload: { roomId: string; clientId: string; nick: string; ready: boolean }) {
  try {
    await fetch("/api/lobby/heartbeat", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ ...payload, ttl: 60 }),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function fetchState(roomId: string): Promise<LobbyUser[] | null> {
  try {
    const res = await fetch(`/api/lobby/state?roomId=${encodeURIComponent(roomId)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as LobbyStateResp;
    if (!json?.ok) return null;
    return Array.isArray(json.users) ? json.users : [];
  } catch {
    return null;
  }
}

async function fetchChat(roomId: string): Promise<ChatItem[] | null> {
  try {
    const res = await fetch(`/api/lobby/chat?roomId=${encodeURIComponent(roomId)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ChatResp;
    if (!json?.ok) return null;
    return Array.isArray(json.items) ? (json.items as ChatItem[]) : [];
  } catch {
    return null;
  }
}

async function sendChat(payload: { roomId: string; clientId: string; nick: string; text: string }) {
  try {
    const res = await fetch("/api/lobby/chat/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

function uniqChat(items: ChatItem[], limit = 60) {
  const seen = new Set<string>();
  const out: ChatItem[] = [];
  for (const it of items) {
    if (!it?.id) continue;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  if (out.length > limit) return out.slice(out.length - limit);
  return out;
}

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<"connecting" | "online" | "offline">("connecting");
  const [players, setPlayers] = React.useState<LobbyUser[]>([]);
  const [history, setHistory] = React.useState<ChatItem[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const clientIdRef = React.useRef<string>(getClientId());
  const nickRef = React.useRef<string>(getNick());

  React.useEffect(() => {
    nickRef.current = getNick();
  });

  // auto-scroll chat
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  // Core loop: heartbeat + polling state/chat
  React.useEffect(() => {
    let alive = true;

    const clientId = clientIdRef.current;
    const heartbeat = async () => {
      const ok = await postHeartbeat({
        roomId: room,
        clientId,
        nick: nickRef.current,
        ready,
      });
      if (!alive) return;
      setStatus(ok ? "online" : "offline");
    };

    const pullState = async () => {
      const s = await fetchState(room);
      if (!alive) return;
      if (s) {
        setPlayers(s.slice(0, 8));
      }
    };

    const pullChat = async () => {
      const c = await fetchChat(room);
      if (!alive) return;
      if (c) {
        setHistory((prev) => {
          const merged = uniqChat([...prev, ...c], 60);
          return merged;
        });
      }
    };

    // initial
    setStatus("connecting");
    heartbeat();
    pullState();
    pullChat();

    // intervals (production-safe values)
    const tHeartbeat = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      heartbeat();
    }, 20_000);

    const tState = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      pullState();
    }, 2_000);

    const tChat = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      pullChat();
    }, 1_200);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        heartbeat();
        pullState();
        pullChat();
      }
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(tHeartbeat);
      window.clearInterval(tState);
      window.clearInterval(tChat);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, ready]);

  const onlineCount = players.length;
  const canReady = onlineCount <= 8;

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
                  <Button
                    variant={ready ? "primary" : "secondary"}
                    onClick={async () => {
                      if (!canReady) return;
                      const next = !ready;
                      setReady(next);

                      // instant heartbeat to reflect ready fast
                      await postHeartbeat({
                        roomId: room,
                        clientId: clientIdRef.current,
                        nick: nickRef.current,
                        ready: next,
                      });
                    }}
                  >
                    {ready ? "Готов" : "Не готов"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const s = await fetchState(room);
                      if (s) setPlayers(s.slice(0, 8));
                    }}
                  >
                    Обновить
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {players.slice(0, 8).map((p) => (
                  <div
                    key={p.clientId}
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
                    <div style={{ fontWeight: 900 }}>{p.nick}</div>
                    <div style={{ opacity: 0.78, fontWeight: 900 }}>{p.ready ? "ready" : "…"}</div>
                  </div>
                ))}
              </div>

              {!canReady ? (
                <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 850, lineHeight: 1.45 }}>
                  Комната заполнена. Ready временно недоступен.
                </div>
              ) : null}
            </div>

            <div className="glassStrong" style={{ borderRadius: 22, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontWeight: 950 }}>Чат</div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const c = await fetchChat(room);
                    if (c) setHistory(uniqChat(c, 60));
                  }}
                >
                  Обновить
                </Button>
              </div>

              <div
                ref={listRef}
                style={{
                  marginTop: 10,
                  height: 260,
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
                      <div style={{ fontWeight: 950 }}>{m.nick}</div>
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
                  placeholder="Написать сообщение"
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
                  }}
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return;
                    const msg = text.trim();
                    if (!msg) return;
                    setText("");

                    // optimistic append
                    const optimistic: ChatItem = {
                      id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
                      t: Date.now(),
                      nick: nickRef.current,
                      text: msg,
                    };
                    setHistory((prev) => uniqChat([...prev, optimistic], 60));

                    await sendChat({
                      roomId: room,
                      clientId: clientIdRef.current,
                      nick: nickRef.current,
                      text: msg,
                    });
                  }}
                />

                <Button
                  variant="primary"
                  onClick={async () => {
                    const msg = text.trim();
                    if (!msg) return;
                    setText("");

                    // optimistic append
                    const optimistic: ChatItem = {
                      id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
                      t: Date.now(),
                      nick: nickRef.current,
                      text: msg,
                    };
                    setHistory((prev) => uniqChat([...prev, optimistic], 60));

                    await sendChat({
                      roomId: room,
                      clientId: clientIdRef.current,
                      nick: nickRef.current,
                      text: msg,
                    });
                  }}
                >
                  Отправить
                </Button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 850, fontSize: 12, lineHeight: 1.45 }}>
                Live: presence/ready обновляются heartbeat. Чат обновляется polling (MVP). Следующий уровень — Durable Objects/WebSocket.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Lobby;
