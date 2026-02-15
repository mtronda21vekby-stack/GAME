import React from "react";
import { Button } from "@blackcrown/ui";

type Item = {
  id: string;
  name: string;
  desc: string;
  price: string;
  rarity: "обычный" | "редкий" | "эпик";
};

export function StorePreview(props: { onBuy: (id: string) => void }) {
  const items: Item[] = [
    { id: "skin_glass_01", name: "Скин: Glasswave", desc: "Стеклянный отблеск + мягкий спектр.", price: "—", rarity: "эпик" },
    { id: "skin_chrome_02", name: "Скин: Chrome Mist", desc: "Холодный хром, тонкие линии.", price: "—", rarity: "редкий" },
    { id: "skin_noir_03", name: "Скин: Noir", desc: "Чистый минимализм без шума.", price: "—", rarity: "обычный" }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
      {items.map((it) => (
        <div key={it.id} className="glass bc-motion" style={{ padding: 14, borderRadius: 16 }}>
          <div className="bc-row" style={{ justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>{it.name}</div>
            <Rarity r={it.rarity} />
          </div>

          <div className="bc-p" style={{ marginTop: 8 }}>{it.desc}</div>

          <div className="bc-divider" style={{ marginTop: 12 }} />

          <div className="bc-row" style={{ justifyContent: "space-between", marginTop: 10, gap: 10, flexWrap: "wrap" }}>
            <div className="bc-faint" style={{ fontWeight: 800 }}>Цена: {it.price}</div>
            <Button variant="secondary" onClick={() => props.onBuy(it.id)}>
              Купить (скоро)
            </Button>
          </div>
        </div>
      ))}

      <style>{`
        @media (max-width: 980px){
          div[style*="gridTemplateColumns: repeat(3"]{ grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px){
          div[style*="gridTemplateColumns: repeat(3"]{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Rarity(props: { r: "обычный" | "редкий" | "эпик" }) {
  const bg =
    props.r === "эпик" ? "rgba(190,90,255,0.16)" :
    props.r === "редкий" ? "rgba(120,160,255,0.14)" :
    "rgba(255,255,255,0.10)";

  return (
    <div style={{
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid var(--stroke)",
      background: bg,
      fontSize: 13,
      fontWeight: 900
    }}>
      {props.r}
    </div>
  );
}
