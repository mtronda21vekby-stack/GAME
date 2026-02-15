import React from "react";
import { Link } from "../router";
import { Button } from "@blackcrown/ui";

export function About() {
  return (
    <main className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
      <div className="glassStrong" style={{ padding: 22 }}>
        <div className="bc-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <h1 className="bc-h2">About</h1>
          <Link to="/"><Button variant="secondary">Back</Button></Link>
        </div>
        <div style={{ marginTop: 10 }} className="bc-p">
          BlackCrown is a premium hub for launching EvoFish and coordinating squads in Lobby.
          Local-first UX. No external analytics SDKs. Cloudflare Pages-friendly architecture.
        </div>
      </div>
    </main>
  );
}
