import React from "react";
import type { Player } from "./lobbyModel";
import { Button } from "@blackcrown/ui";

export function PlayersPanel(props: {
  me: string;
  players: Player[];
  onToggleReady: (v: boolean) => void;
}) {
  const me = props.players.find((p) => p.name === props.me);
  const ready = !!me?.ready;

  return (
    <div className="glassStrong" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="bc-row" style={{ justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>Players</div>
        <div className="bc-faint">{props.players.length}/8</div>
      </div>

      <div className="bc-col" style={{ gap: 8 }}>
        {props.players.slice(0, 8).map((p) => (
          <div
            key={p.name}
            className="bc-row"
            style={{ justifyContent: "space-between", borderRadius: 14, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.05)", padding: "10px 12px" }}
          >
            <div className="bc-row" style={{ gap: 10 }}>
              <div style={{ fontWeight: 850 }}>{p.name === props.me ? "You" : p.name}</div>
              <div className="bc-faint" style={{ fontSize: 12 }}>{p.ready ? "READY" : "NOT READY"}</div>
            </div>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: p.ready ? "rgba(80,255,210,0.85)" : "rgba(255,255,255,0.25)" }} />
          </div>
        ))}
      </div>

      <Button variant={ready ? "secondary" : "primary"} onClick={() => props.onToggleReady(!ready)}>
        {ready ? "Unready" : "Ready"}
      </Button>
    </div>
  );
}
