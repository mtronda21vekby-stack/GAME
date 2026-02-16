import React from "react";
import { Button } from "@blackcrown/ui";
import { HeroArt } from "@blackcrown/assets";
import { PageShell } from "./_Layout";

type Item = {
  id: string;
  title: string;
  desc: string;
  tag: string;
};

const items: Item[] = [
  { id: "glasswave", title: "Glasswave", desc: "Мягкий свет, стеклянная глубина и чистые контуры.", tag: "Skin" },
  { id: "chromemist", title: "Chrome Mist", desc: "Холодный хром и тонкие линии — минимализм без шума.", tag: "Skin" },
  { id: "noir", title: "Noir", desc: "Контрастный профиль и строгая подача.", tag: "Skin" }
];

export function Store() {
  return (
    <PageShell
      title="Магазин"
      subtitle="Коллекции и стили. Витрина обновляется по мере релизов."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        {items.map((it) => (
          <div
            key={it.id}
            className="glassStrong"
            style={{
              borderRadius: 24,
              padding: 16,
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: "-0.02em" }}>{it.title}</div>
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.06)",
                  fontWeight: 850,
                  opacity: 0.9
                }}
              >
                {it.tag}
              </span>
            </div>

            <div style={{ marginTop: 8, opacity: 0.86, lineHeight: 1.45 }}>{it.desc}</div>

            <img
              alt=""
              src={HeroArt.cardWave}
              style={{
                width: "100%",
                height: 160,
                objectFit: "cover",
                borderRadius: 18,
                border: "none",
                display: "block",
                marginTop: 12,
                opacity: 0.95
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <Button variant="secondary" onClick={() => { /* витрина */ }}>
                Подробнее
              </Button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 960px) {
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageShell>
  );
}
