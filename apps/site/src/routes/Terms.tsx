import React from "react";
import { Link } from "../router";
import { Button } from "@blackcrown/ui";

export function Terms() {
  return (
    <main className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
      <div className="glassStrong" style={{ padding: 22 }}>
        <div className="bc-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h1 className="bc-h2">Terms</h1>
          <Link to="/"><Button variant="secondary">Back</Button></Link>
        </div>

        <div style={{ marginTop: 10 }} className="bc-p">
          This is a pre-release experience. Store preview is a visual stub. Gameplay and lobby features may change.
        </div>
      </div>
    </main>
  );
}
