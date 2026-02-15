import React from "react";

type Entry = { version: string; date: string; items: string[] };

export function Changelog() {
  const entries: Entry[] = [
    {
      version: "v0.00.1-alpha",
      date: "сегодня",
      items: [
        "Моно-репо: site + game + lobby",
        "Сборка под один домен через assemble (dist/)",
        "Редиректы для SPA (/game, /lobby, страницы сайта)",
        "Фикс pnpm workspace зависимостей (ui -> assets)"
      ]
    }
  ];

  return (
    <div className="bc-col" style={{ gap: 10 }}>
      {entries.map((e) => (
        <div key={e.version} className="glass" style={{ padding: 14, borderRadius: 16 }}>
          <div className="bc-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>{e.version}</div>
            <div className="bc-faint" style={{ fontWeight: 700 }}>{e.date}</div>
          </div>

          <ul className="bc-p" style={{ marginTop: 8, lineHeight: 1.75 }}>
            {e.items.map((it, idx) => <li key={idx}>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
