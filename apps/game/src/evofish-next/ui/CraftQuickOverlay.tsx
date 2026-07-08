import React, { useEffect, useMemo, useState } from "react";
import { getCraftCostLabel, NEXT_CRAFT_RECIPES, normalizeCraftInventory, type NextCraftInventory } from "../content/craft";
import { loadEvoFishNextSave } from "../state/nextSaveStore";
import { queueCraftAction, readCraftInventorySnapshot, readCraftWalletSnapshot } from "../systems/craftSystem";
import { setEvoFishPauseSource } from "../systems/runtimePause";

function fmt(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function stockLabel(inventory: NextCraftInventory, recipeId: string) {
  return Math.max(0, Math.floor(inventory[recipeId] || 0));
}

function walletSnapshot() {
  return readCraftWalletSnapshot() || loadEvoFishNextSave().economy;
}

export function CraftQuickOverlay() {
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState<NextCraftInventory>(() => normalizeCraftInventory(readCraftInventorySnapshot()));
  const [wallet, setWallet] = useState(() => walletSnapshot());
  const totalStock = useMemo(() => Object.values(inventory).reduce((sum, value) => sum + Math.max(0, Math.floor(value || 0)), 0), [inventory]);

  const refresh = () => {
    setInventory(normalizeCraftInventory(readCraftInventorySnapshot()));
    setWallet(walletSnapshot());
  };

  useEffect(() => {
    const hideLegacyCraft = () => {
      document.querySelectorAll<HTMLButtonElement>(".efMenuGrid button").forEach((button) => {
        const text = (button.textContent || "").toLowerCase();
        if (text.includes("крафт") || text.includes("craft")) {
          button.style.display = "none";
          button.setAttribute("aria-hidden", "true");
          button.tabIndex = -1;
        }
      });
    };
    const observer = new MutationObserver(hideLegacyCraft);
    hideLegacyCraft();
    observer.observe(document.body, { childList: true, subtree: true });
    const tick = window.setInterval(() => { refresh(); hideLegacyCraft(); }, 250);
    window.addEventListener("storage", refresh);
    window.addEventListener("evofish_next_save_changed", refresh as EventListener);
    return () => {
      observer.disconnect();
      window.clearInterval(tick);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("evofish_next_save_changed", refresh as EventListener);
      setEvoFishPauseSource("craft", false);
    };
  }, []);

  useEffect(() => {
    setEvoFishPauseSource("craft", open);
    return () => setEvoFishPauseSource("craft", false);
  }, [open]);

  const refreshSoon = () => {
    window.setTimeout(refresh, 30);
    window.setTimeout(refresh, 90);
    window.setTimeout(refresh, 180);
    window.setTimeout(refresh, 360);
  };

  const buy = (recipeId: string, amount = 1) => {
    queueCraftAction("buy", recipeId, amount);
    refreshSoon();
  };

  const use = (recipeId: string) => {
    queueCraftAction("use", recipeId, 1);
    refreshSoon();
    setOpen(false);
  };

  return (
    <section className={`efCraftQuick ${open ? "open" : ""}`} onPointerDown={(event) => event.stopPropagation()} onPointerMove={(event) => event.stopPropagation()}>
      <button className="efCraftBubble" onClick={() => setOpen((current) => !current)}>
        <b>⚒</b><span>{totalStock}</span>
      </button>
      {open ? (
        <div className="efCraftDrawer">
          <header><b>Крафт</b><small>🦪 {fmt(wallet.pearls)} · 💎 {fmt(wallet.corals)}</small></header>
          <div className="efCraftGrid">
            {NEXT_CRAFT_RECIPES.map((recipe) => {
              const stock = stockLabel(inventory, recipe.id);
              const canBuy = wallet.pearls >= (recipe.cost.pearls || 0) && wallet.corals >= (recipe.cost.corals || 0);
              return (
                <article key={recipe.id}>
                  <div className="line"><b>{recipe.shortName}</b><span>x{stock}</span><em>{recipe.duration ? `${recipe.duration}с` : "instant"}</em></div>
                  <small>{getCraftCostLabel(recipe.cost)}</small>
                  <div className="actions">
                    <button disabled={!canBuy} onClick={() => buy(recipe.id, 1)}>+1</button>
                    <button disabled={!canBuy} onClick={() => buy(recipe.id, 5)}>+5</button>
                    <button className="use" disabled={stock <= 0} onClick={() => use(recipe.id)}>АКТ</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
      <style>{`
        .efMenuGrid button:first-child{display:none!important}.efMenuGrid button[aria-label*="craft" i],.efMenuGrid button[aria-label*="крафт" i]{display:none!important}.efCraftQuick{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(max(12px,env(safe-area-inset-bottom)) + 148px);z-index:10002;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#e7f2ff;pointer-events:auto}.efCraftBubble{width:52px;height:52px;border-radius:18px;border:1px solid rgba(255,220,120,.34);background:linear-gradient(135deg,rgba(255,220,120,.22),rgba(120,240,255,.14));color:#e7f2ff;box-shadow:0 18px 48px rgba(0,0,0,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:grid;place-items:center;position:relative}.efCraftBubble b{font-size:21px;line-height:1}.efCraftBubble span{position:absolute;right:-6px;top:-6px;min-width:22px;height:22px;border-radius:999px;background:rgba(255,90,90,.92);border:1px solid rgba(255,255,255,.38);font-size:11px;font-weight:1000;display:grid;place-items:center}.efCraftDrawer{position:absolute;right:0;bottom:60px;width:min(302px,calc(100vw - 24px));max-height:42vh;overflow:auto;border-radius:20px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.88);box-shadow:0 18px 52px rgba(0,0,0,.38);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:10px;box-sizing:border-box}.efCraftDrawer header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.efCraftDrawer header b{font-size:16px}.efCraftDrawer header small,.efCraftGrid small,.efCraftGrid .line em{color:rgba(231,242,255,.68)}.efCraftGrid{display:grid;gap:6px}.efCraftGrid article{border:1px solid rgba(150,230,255,.12);background:rgba(255,255,255,.05);border-radius:14px;padding:7px;display:grid;gap:5px}.efCraftGrid .line{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:7px}.efCraftGrid .line b{color:#fff3a0;font-size:14px}.efCraftGrid .line span{font-weight:1000;color:#78f0ff;font-size:14px}.efCraftGrid .line em{text-align:right;font-style:normal;font-size:11px}.efCraftGrid small{font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efCraftGrid .actions{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:5px}.efCraftGrid button{min-height:30px;border-radius:11px;border:1px solid rgba(150,230,255,.16);background:rgba(255,255,255,.07);color:#e7f2ff;font-weight:1000;font-size:12px}.efCraftGrid button.use{background:linear-gradient(135deg,rgba(120,240,255,.22),rgba(255,220,120,.12));border-color:rgba(120,240,255,.34)}.efCraftGrid button:disabled{opacity:.36}@media(max-height:650px){.efCraftQuick{bottom:calc(max(10px,env(safe-area-inset-bottom)) + 116px)}.efCraftDrawer{max-height:38vh}}`}</style>
    </section>
  );
}
