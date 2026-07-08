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
        if (text.includes("крафт") || text.includes("craft")) button.style.display = "none";
      });
    };
    const observer = new MutationObserver(hideLegacyCraft);
    hideLegacyCraft();
    observer.observe(document.body, { childList: true, subtree: true });
    const tick = window.setInterval(() => { refresh(); hideLegacyCraft(); }, 450);
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
    window.setTimeout(refresh, 60);
    window.setTimeout(refresh, 160);
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
    <section className={`efCraftQuick ${open ? "open" : ""}`}>
      <button className="efCraftBubble" onClick={() => setOpen((current) => !current)}>
        <b>⚒</b><span>{totalStock}</span>
      </button>
      {open ? (
        <div className="efCraftDrawer">
          <header><b>Крафт-инвентарь</b><small>🦪 {fmt(wallet.pearls)} · 💎 {fmt(wallet.corals)}</small></header>
          <p>Покупай усиления заранее. Они лежат в инвентаре и активируются вручную во время забега. Пока окно открыто — игра на паузе.</p>
          <div className="efCraftGrid">
            {NEXT_CRAFT_RECIPES.map((recipe) => {
              const stock = stockLabel(inventory, recipe.id);
              const canBuy = wallet.pearls >= (recipe.cost.pearls || 0) && wallet.corals >= (recipe.cost.corals || 0);
              return (
                <article key={recipe.id}>
                  <div><b>{recipe.shortName}</b><span>x{stock}</span></div>
                  <strong>{recipe.name}</strong>
                  <small>{recipe.description}</small>
                  <em>{getCraftCostLabel(recipe.cost)} · {recipe.duration ? `${recipe.duration}с` : "мгновенно"}</em>
                  <div className="actions">
                    <button disabled={!canBuy} onClick={() => buy(recipe.id, 1)}>+1</button>
                    <button disabled={!canBuy} onClick={() => buy(recipe.id, 5)}>+5</button>
                    <button className="use" disabled={stock <= 0} onClick={() => use(recipe.id)}>Актив.</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
      <style>{`
        .efMenuGrid button:first-child{display:none!important}.efMenuGrid button[aria-label*="craft" i],.efMenuGrid button[aria-label*="крафт" i]{display:none!important}.efCraftQuick{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(max(12px,env(safe-area-inset-bottom)) + 118px);z-index:10002;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#e7f2ff;pointer-events:auto}.efCraftBubble{width:54px;height:54px;border-radius:18px;border:1px solid rgba(255,220,120,.34);background:linear-gradient(135deg,rgba(255,220,120,.22),rgba(120,240,255,.14));color:#e7f2ff;box-shadow:0 18px 48px rgba(0,0,0,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:grid;place-items:center;position:relative}.efCraftBubble b{font-size:22px;line-height:1}.efCraftBubble span{position:absolute;right:-6px;top:-6px;min-width:22px;height:22px;border-radius:999px;background:rgba(255,90,90,.92);border:1px solid rgba(255,255,255,.38);font-size:11px;font-weight:1000;display:grid;place-items:center}.efCraftDrawer{position:absolute;right:0;bottom:64px;width:min(360px,calc(100vw - 24px));max-height:58vh;overflow:auto;border-radius:24px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.92);box-shadow:0 22px 70px rgba(0,0,0,.42);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:12px;box-sizing:border-box}.efCraftDrawer header{display:flex;align-items:center;justify-content:space-between;gap:10px}.efCraftDrawer header b{font-size:17px}.efCraftDrawer header small,.efCraftDrawer p,.efCraftGrid small,.efCraftGrid em{color:rgba(231,242,255,.70)}.efCraftDrawer p{font-size:12px;line-height:1.35;margin:7px 0 10px}.efCraftGrid{display:grid;gap:8px}.efCraftGrid article{border:1px solid rgba(150,230,255,.14);background:rgba(255,255,255,.055);border-radius:18px;padding:10px;display:grid;gap:6px}.efCraftGrid article>div:first-child{display:flex;justify-content:space-between;gap:8px}.efCraftGrid article>div:first-child b{color:#fff3a0}.efCraftGrid article>div:first-child span{font-weight:1000;color:#78f0ff}.efCraftGrid strong{font-size:14px}.efCraftGrid small{font-size:11px;line-height:1.35}.efCraftGrid em{font-style:normal;font-size:11px}.efCraftGrid .actions{display:grid;grid-template-columns:1fr 1fr 1.35fr;gap:6px}.efCraftGrid button{min-height:34px;border-radius:12px;border:1px solid rgba(150,230,255,.16);background:rgba(255,255,255,.07);color:#e7f2ff;font-weight:1000}.efCraftGrid button.use{background:linear-gradient(135deg,rgba(120,240,255,.20),rgba(255,220,120,.12));border-color:rgba(120,240,255,.34)}.efCraftGrid button:disabled{opacity:.42}@media(max-height:650px){.efCraftQuick{bottom:calc(max(10px,env(safe-area-inset-bottom)) + 96px)}.efCraftDrawer{max-height:50vh}}`}</style>
    </section>
  );
}
