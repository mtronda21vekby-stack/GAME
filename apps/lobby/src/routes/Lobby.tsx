import React, { useEffect, useMemo, useState } from "react";
import { userStorage } from "@blackcrown/core";
import { Button } from "@blackcrown/ui";
import { createLobbyModel, LobbyState } from "../features/lobby/lobbyModel";
import { PlayersPanel } from "../features/lobby/PlayersPanel";
import { ChatPanel } from "../features/lobby/ChatPanel";

const PATHS = {
  site: "/",
  game: "/game/"
} as const;

export function Lobby() {
  const nickname = userStorage.getString("nickname", "");
  const me = nickname || "Игрок";
  const lobbyId = "main";

  const model = useMemo(() => createLobbyModel({ lobbyId, me }), [lobbyId, me]);
  const [state, setState] = useState<LobbyState>({
    lobbyId, me, players: [{ name: me, ready: false }], chat: []
  });

  useEffect(() => {
    const unsub = model.subscribe(setState);
    model.connect();
    return () => { unsub(); model.dispose(); };
  }, [model]);

  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      <div className="bc-container" style={{ padding: "max(12px, env(safe-area-inset-top)) 0 18px" }}>
        <div className="bc-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="bc-col" style={{ gap: 2 }}>
            <div className="bc-h2">Лобби</div>
            <div className="bc-p">Пока локальный mock-транспорт. Открой 2 вкладки — увидишь “8 игроков”.</div>
          </div>
          <div className="bc-row" style={{ flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => (window.location.href = PATHS.site)}>На сайт</Button>
            <Button variant="primary" onClick={() => (window.location.href = PATHS.game)}>В игру</Button>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 12, minHeight: "calc(100vh - 160px)" }}>
          <PlayersPanel me={state.me} players={state.players} onToggleReady={(v) => model.ready(v)} />
          <ChatPanel me={state.me} chat={state.chat} onSend={(m) => model.chat(m)} />
        </div>

        <style>{`
          @media (max-width: 900px){
            div[style*="gridTemplateColumns: 0.9fr"]{
              grid-template-columns: 1fr !important;
              min-height: auto !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}
