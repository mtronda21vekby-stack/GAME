import React from "react";

export function Roadmap() {
  const items = [
    { title: "Единый домен", status: "готово", desc: "Сайт + /game + /lobby в одном dist." },
    { title: "Контейнер игры", status: "в процессе", desc: "Настройки, fullscreen, ввод, стабильная загрузка EvoFish." },
    { title: "Лобби (8 игроков)", status: "в процессе", desc: "Ready/unready, чат, анти-спам, транспорт-абстракция." },
    { title: "Магазин (превью)", status: "план", desc: "Карточки скинов, витрина, позже — платежи." },
    { title: "Сервер WebSocket", status: "план", desc: "Подключим реальный сервер вместо локального mock." }
  ];

  return (
    <div className="bc-col" style={{ gap: 10 }}>
      {items.map((it) => (
        <div key={it.title} className="glass" style={{ padding: 14, borderRadius: 16 }}>
          <div className="bc-row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 850 }}>{it.title}</div>
            <Badge status={it.status} />
          </div>
          <div className="bc-p" style={{ marginTop: 6 }}>{it.desc}</div>
        </div>
      ))}
    </div>
  );
}

function Badge(props: { status: "готово" | "в процессе" | "план" }) {
  const map: Record<string, string> = {
    "готово": "rgba(80,255,210,0.14)",
    "в процессе": "rgba(120,160,255,0.14)",
    "план": "rgba(255,255,255,0.10)"
  };

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--stroke)",
        background: map[props.status],
        fontSize: 13,
        fontWeight: 800
      }}
    >
      {props.status}
    </div>
  );
}
