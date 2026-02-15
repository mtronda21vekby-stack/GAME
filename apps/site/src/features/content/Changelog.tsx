import React from "react";

const log = [
  { date: "2026-02-14", lines: ["Initial monorepo structure", "Apple-like UI kit", "Site PWA shell cache", "Game container + lobby mock transport"] }
];

export function Changelog() {
  return (
    <div className="bc-col">
      {log.map((e) => (
        <div key={e.date} className="bc-card" style={{ padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
          <div className="bc-row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 850 }}>{e.date}</div>
            <div className="bc-faint">Build</div>
          </div>
          <ul className="bc-p" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {e.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
