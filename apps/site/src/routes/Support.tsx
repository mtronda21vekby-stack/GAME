import React from "react";
import { Link } from "../router";
import { Button } from "@blackcrown/ui";

export function Support() {
  return (
    <main className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
      <div className="glassStrong" style={{ padding: 22 }}>
        <div className="bc-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h1 className="bc-h2">Support</h1>
          <Link to="/"><Button variant="secondary">Back</Button></Link>
        </div>

        <div style={{ marginTop: 10 }} className="bc-col">
          <div className="bc-p">FAQ:</div>
          <ul className="bc-p" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Nickname is stored locally on your device.</li>
            <li>Game is loaded in an isolated container (iframe) to avoid breaking logic.</li>
            <li>Lobby uses a mock WebSocket transport for now.</li>
          </ul>
          <div className="bc-p" style={{ marginTop: 10 }}>
            Contact: <span className="bc-muted">support@blackcrown (placeholder)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
