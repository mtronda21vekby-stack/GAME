import React from "react";

const items = [
  { q: "Now", t: "Monorepo + modular UI + Cloudflare Pages setup" },
  { q: "Next", t: "Real WS server transport + auth (optional) + lobby rooms" },
  { q: "Soon", t: "EvoFish packaging, performance budget, input modes" }
];

export function Roadmap() {
  return (
    <div className="bc-col">
      {items.map((it) => (
        <div key={it.q} className="bc-card" style={{ padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
          <div className="bc-row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800 }}>{it.q}</div>
            <div className="bc-faint">Milestone</div>
          </div>
          <div className="bc-p" style={{ marginTop: 6 }}>{it.t}</div>
        </div>
      ))}
    </div>
  );
}
