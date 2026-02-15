import React from "react";
import { Link } from "../router";
import { Button } from "@blackcrown/ui";

export function Privacy() {
  return (
    <main className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
      <div className="glassStrong" style={{ padding: 22 }}>
        <div className="bc-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h1 className="bc-h2">Privacy</h1>
          <Link to="/"><Button variant="secondary">Back</Button></Link>
        </div>

        <div style={{ marginTop: 10 }} className="bc-p">
          We store only a nickname and UI preferences in <b>localStorage</b>. No external tracking SDKs.
          Analytics hooks are local and can be wired to your own endpoint later.
        </div>
      </div>
    </main>
  );
}
