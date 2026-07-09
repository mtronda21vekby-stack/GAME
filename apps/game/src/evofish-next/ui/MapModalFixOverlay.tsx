import React, { useEffect, useState } from "react";
import { NEXT_MAP_ZONES } from "../content/zones";

function isMapButton(target: EventTarget | null) {
  const button = target instanceof Element ? target.closest("button") : null;
  if (!button || button.closest(".efSafeMapOverlay") || button.closest(".efGamePanel")) return false;
  const text = (button.textContent || "").trim().toLowerCase();
  return text === "карта" || text === "map";
}

export function MapModalFixOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const interceptMapOpen = (event: Event) => {
      if (!isMapButton(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      setOpen(true);
    };

    document.addEventListener("pointerdown", interceptMapOpen, true);
    document.addEventListener("click", interceptMapOpen, true);
    return () => {
      document.removeEventListener("pointerdown", interceptMapOpen, true);
      document.removeEventListener("click", interceptMapOpen, true);
    };
  }, []);

  return (
    <>
      {open ? (
        <section className="efSafeMapOverlay" onClick={() => setOpen(false)}>
          <div className="efSafeMapPanel" onClick={(event) => event.stopPropagation()}>
            <header><b>Карта мира</b><button onClick={() => setOpen(false)}>×</button></header>
            <div className="efSafeMapBody">
              <div className="efSafeMapOcean">
                {NEXT_MAP_ZONES.map((zone, index) => (
                  <span
                    key={zone.id}
                    style={{ left: `${12 + (index % 3) * 30}%`, top: `${14 + Math.floor(index / 3) * 24}%`, background: zone.color }}
                    title={zone.name}
                  >
                    {zone.name}
                  </span>
                ))}
              </div>
              <p>Стабильная лёгкая карта зон. Live-SVG карта временно отключена, потому что она ломала игру на телефоне.</p>
            </div>
          </div>
        </section>
      ) : null}
      <style>{`
        .efGamePanel.mapPanel{display:none!important}.efSafeMapOverlay{position:fixed;inset:0;z-index:10020;background:rgba(1,7,12,.42);display:grid;place-items:center;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));box-sizing:border-box;pointer-events:auto}.efSafeMapPanel{width:min(94vw,760px);height:min(76dvh,720px);border-radius:24px;border:1px solid rgba(150,230,255,.18);background:rgba(4,18,30,.90);box-shadow:0 22px 70px rgba(0,0,0,.42);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);overflow:hidden;display:flex;flex-direction:column;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efSafeMapPanel header{height:62px;flex:0 0 62px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(150,230,255,.14)}.efSafeMapPanel header b{font-size:23px;font-weight:1000}.efSafeMapPanel header button{width:44px;height:44px;border-radius:50%;border:1px solid rgba(150,230,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:28px;font-weight:900}.efSafeMapBody{flex:1;min-height:0;display:grid;grid-template-rows:1fr auto;gap:10px;padding:12px}.efSafeMapOcean{position:relative;overflow:hidden;border-radius:18px;border:1px solid rgba(150,230,255,.16);background:radial-gradient(circle at 72% 24%,rgba(110,255,180,.14),transparent 30%),radial-gradient(circle at 22% 80%,rgba(190,140,255,.16),transparent 28%),linear-gradient(180deg,rgba(4,30,48,.82),rgba(2,12,24,.92))}.efSafeMapOcean:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:54px 54px}.efSafeMapOcean span{position:absolute;transform:translate(-50%,-50%);min-width:108px;text-align:center;border-radius:999px;border:1px solid rgba(255,255,255,.22);padding:8px 10px;color:rgba(231,242,255,.90);font-size:12px;font-weight:1000;text-shadow:0 2px 8px rgba(0,0,0,.44);box-shadow:0 14px 34px rgba(0,0,0,.18)}.efSafeMapBody p{margin:0;color:rgba(231,242,255,.72);font-size:12px;line-height:1.35}@media(max-width:520px){.efSafeMapPanel{width:calc(100vw - 12px);height:min(76dvh,720px);border-radius:22px}.efSafeMapPanel header{height:58px;flex-basis:58px}.efSafeMapOcean span{min-width:88px;font-size:10.5px;padding:7px 8px}.efSafeMapBody{padding:10px}}
      `}</style>
    </>
  );
}
