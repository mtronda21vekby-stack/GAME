import React from "react";
import { Button } from "@blackcrown/ui";
import { userStorage, createLobbyClient, LobbyChatMsg, LobbyPlayer } from "@blackcrown/core";

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
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<"connecting" | "online" | "offline">("connecting");
  const [players, setPlayers] = React.useState<LobbyPlayer[]>([]);
  const [history, setHistory] = React.useState<LobbyChatMsg[]>([]);
  const [ready, setReady] = React.useState(false);

  const [text, setText] = React.useState("");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  // IMPORTANT: один клиент на весь lifecycle экрана
  const clientRef = React.useRef<ReturnType<typeof createLobbyClient> | null>(null);
  const joinedRef = React.useRef(false);
  const nickRef = React.useRef(getNick());

  // держим ник актуальным (если пользователь меняет в аккаунте)
  React.useEffect(() => {
    const sync = () => {
      nickRef.current = getNick();
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync as any);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync as any);
    };
  }, []);

  React.useEffect(() => {
    joinedRef.current = false;
    setStatus("connecting");

    const client = createLobbyClient(room, {
      onOpen: () => setStatus("online"),
      onClose: () => setStatus("offline"),

      onHello: (m) => {
        setPlayers(m.players);
        setHistory(m.history);
        setReady(m.you.ready);

        // join только один раз на соединение
        if (!joinedRef.current) {
          joinedRef.current = true;
          client.join(nickRef.current);
        }
      },

      onPlayers: (m) => setPlayers(m.players),

      onChat: (m) => {
        setHistory((prev) => {
          const next = [...prev, m.msg];
          return next.length > 80 ? next.slice(-80) : next;
        });
      },
    });

    clientRef.current = client;

    return () => {
      clientRef.current = null;
      joinedRef.current = false;
      client.close();
    };
  }, [room]);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const onlineCount = players.length;
  const canReady = onlineCount <= 8;
  const isOnline = status === "online";

  const send = React.useCallback(() => {
    const msg = clampText(text);
    if (!msg) return;

    // UX: сразу очищаем поле
    setText("");

    const c = clientRef.current;
    if (!c || !isOnline) return;

    // НИКАКИХ новых клиентов — только текущий
    c.chat(msg);
  }, [text, isOnline]);

  const toggleReady = React.useCallback(() => {
    if (!canReady) return;

    const next = !ready;
    setReady(next);

    const c = clientRef.current;
    if (!c || !isOnline) return;

    // НИКАКИХ новых клиентов — только текущий
    c.setReady(next);
  }, [canReady, ready, isOnline]);

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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 950 }}>Игроки</div>

                <Button variant={ready ? "primary" : "secondary"} onClick={toggleReady} disabled={!isOnline || !canReady}>
                  {ready ? "Готов" : "Не готов"}
                </Button>
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
                      <div style={{ fontWeight: 950 }}>{m.fromName}</div>
                      <div style={{ opacity: 0.68, fontWeight: 850, fontSize: 12 }}>{fmtTime(m.at)}</div>
                    </div>
                    <div style={{ opacity: 0.88, lineHeight: 1.4, wordBreak: "break-word" }}>{m.text}</div>
                  </div>
                ))}
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
                      send();
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

                <Button variant="primary" onClick={send} disabled={!isOnline}>
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
