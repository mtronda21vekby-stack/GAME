import React from "react";
import { Button } from "@blackcrown/ui";

const skins = [
  { id: "glass-fin", name: "Glass Fin", price: "$1.99", tone: "rgba(140,180,255,0.25)" },
  { id: "midnight-coral", name: "Midnight Coral", price: "$2.99", tone: "rgba(190,90,255,0.22)" },
  { id: "neon-pearl", name: "Neon Pearl", price: "$4.99", tone: "rgba(80,255,210,0.16)" }
];

export function StorePreview(props: { onBuy: () => void }) {
  return (
    <div className="bc-col">
      <div className="bc-p">Visual preview only. Purchases disabled (stub).</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {skins.map((s) => (
          <div key={s.id} className="bc-card" style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.06)" }}>
            <div style={{
              height: 110,
              borderRadius: 14,
              border: "1px solid var(--stroke)",
              background: `radial-gradient(200px 140px at 20% 30%, ${s.tone}, transparent 60%), rgba(255,255,255,0.04)`
            }} />
            <div style={{ marginTop: 10, fontWeight: 850 }}>{s.name}</div>
            <div className="bc-p">{s.price}</div>
            <div style={{ marginTop: 10 }}>
              <Button variant="primary" onClick={props.onBuy}>Buy (stub)</Button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px){
          div[style*="gridTemplateColumns: repeat(3"]{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
