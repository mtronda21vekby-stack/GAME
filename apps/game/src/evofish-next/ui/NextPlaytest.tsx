import React, { useEffect, useRef, useState } from "react";
import { Link } from "../../router";
import type { NextEngineState, NextEngineStats, NextInputState } from "../core/engineTypes";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import { getCraftCostLabel, NEXT_CRAFT_RECIPES } from "../content/craft";
import { EVOFISH_FORMS } from "../content/forms";
import { getMutationLevel, NEXT_MUTATIONS } from "../content/mutations";
import { NEXT_QUESTS, type NextQuestDefinition } from "../content/quests";
import { canUseSkinInNext, getSkinUnlockReasons } from "../content/skinUnlockRules";
import { EVOFISH_SKIN_BY_ID, getSkinsForForm } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import { renderNextWorld } from "../render/worldRenderer";
import { applyCraftRecipe, canCraftRecipe } from "../systems/craftSystem";
import { createNextWorld } from "../systems/createWorld";
import { stepNextEngine } from "../systems/engineStep";
import { refreshMutationStats } from "../systems/progressionSystem";
import {
  buyMutation,
  buySkin,
  canBuyMutation,
  canBuySkin,
  equipSkin,
  isSkinOwned,
  loadEvoFishNextSave,
  saveEvoFishNextProgress,
  saveEvoFishNextSave
} from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

type NextPanel = "craft" | "mutations" | "quests" | "shop" | null;

const FORM_ORDER: EvoFishFormId[] = ["fish", "shark", "megalodon"];

function questValue(stats: NextEngineStats, quest: NextQuestDefinition) {
  if (quest.metric === "kills") return stats.kills;
  if (quest.metric === "mass") return stats.mass;
  if (quest.metric === "level") return stats.level;
  if (quest.metric === "tier") return stats.tier;
  if (quest.metric === "pearls") return stats.pearls;
  if (quest.metric === "corals") return stats.corals;
  return 0;
}

function skinPriceLabel(skin: EvoFishSkinDefinition) {
  if (skin.unlock.type === "free") return "Бесплатно";
  if (skin.unlock.type === "currency") return `${skin.unlock.amount} ${skin.unlock.currency === "pearls" ? "жемчуг" : "кораллы"}`;
  return "Achievement";
}

function lockLabel(reasons: { label: string }[]) {
  return reasons[0]?.label || "Locked";
}

export function NextPlaytest() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<NextEngineState | null>(null);
  const inputRef = useRef<NextInputState>({ pointerX: 0, pointerY: 0, down: false, bite: false, dash: false });
  const [saveState, setSaveState] = useState(() => loadEvoFishNextSave());
  const [activePanel, setActivePanel] = useState<NextPanel>(null);
  const [shopForm, setShopForm] = useState<EvoFishFormId>("fish");
  const [stats, setStats] = useState<NextEngineStats>({
    mass: 1,
    kills: 0,
    deaths: 0,
    downs: 0,
    hp: 1,
    hpMax: 1,
    level: 1,
    tier: 1,
    xp: 0,
    xpToNext: 1,
    levelXp: 0,
    levelXpToNext: 1,
    pearls: 0,
    corals: 0,
    mutationLevel: 0,
    craftBarrierT: 0,
    craftBiteBoostT: 0,
    craftSonarT: 0,
    zoneId: "open_water",
    zoneName: "Open Water",
    zoneEffect: "Neutral water.",
    zoneRisk: 0,
    zoneRewardBoost: 1,
    completedQuests: 0,
    activeQuestTitle: "—",
    activeQuestProgress: 0,
    activeQuestTarget: 1,
    apexAlive: false,
    apexName: "—",
    apexHp: 0,
    apexHpMax: 1,
    dead: false,
    downed: false,
    respawnTime: 0,
    reviveTime: 0,
    skinName: "—",
    formName: "—",
    lastEvent: "Готов"
  });

  const skin = EVOFISH_SKIN_BY_ID[saveState.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let live = true;
    let last = performance.now();
    let saveTimer = 0;
    const input = inputRef.current;
    const engine = createNextWorld(skin, saveState.progress, saveState.economy, saveState.quests, saveState.mutations);
    engineRef.current = engine;

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      input.pointerX = event.clientX - rect.left;
      input.pointerY = event.clientY - rect.top;
    };

    const onDown = (event: PointerEvent) => {
      input.down = true;
      pointer(event);
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => pointer(event);
    const onUp = () => { input.down = false; };

    resize();
    setStats({ ...engine.stats });
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const loop = (now: number) => {
      if (!live) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      const viewport = {
        width: canvas.clientWidth || 1,
        height: canvas.clientHeight || 1
      };

      stepNextEngine(engine, input, viewport, dt);
      renderNextWorld(ctx, engine, viewport);

      saveTimer += dt;
      if (saveTimer >= 2) {
        saveTimer = 0;
        saveEvoFishNextProgress(engine);
      }

      if (engine.frame % 10 === 0) setStats({ ...engine.stats });
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      live = false;
      saveEvoFishNextProgress(engine);
      if (engineRef.current === engine) engineRef.current = null;
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const togglePanel = (panel: Exclude<NextPanel, null>) => {
    setActivePanel((current) => current === panel ? null : panel);
  };

  const liveSave = {
    ...saveState,
    economy: {
      pearls: Math.max(0, Math.floor(stats.pearls || saveState.economy.pearls || 0)),
      corals: Math.max(0, Math.floor(stats.corals || saveState.economy.corals || 0))
    }
  };

  const buyMutationLevel = (id: string) => {
    const engine = engineRef.current;
    if (engine) saveEvoFishNextProgress(engine);

    const fresh = loadEvoFishNextSave();
    const next = buyMutation(fresh, id);
    if (next === fresh) return;

    if (engine) {
      engine.economy = next.economy;
      engine.mutations = next.mutations;
      refreshMutationStats(engine);
      saveEvoFishNextProgress(engine);
      setStats({ ...engine.stats });
    } else {
      saveEvoFishNextSave(next);
    }

    setSaveState(next);
  };

  const applySkinAction = (skinId: string) => {
    const engine = engineRef.current;
    if (engine) saveEvoFishNextProgress(engine);

    const fresh = loadEvoFishNextSave();
    const next = isSkinOwned(fresh, skinId) ? equipSkin(fresh, skinId) : buySkin(fresh, skinId);
    if (next === fresh) return;

    const nextSkin = EVOFISH_SKIN_BY_ID[next.loadout.equippedSkinId];
    saveEvoFishNextSave(next);

    if (engine && nextSkin) {
      engine.economy = next.economy;
      engine.player.skin = nextSkin;
      engine.stats.skinName = nextSkin.name;
      saveEvoFishNextProgress(engine);
      setStats({ ...engine.stats });
    }

    setSaveState(next);
  };

  const craftRecipe = (id: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!applyCraftRecipe(engine, id)) return;
    saveEvoFishNextProgress(engine);
    setStats({ ...engine.stats });
  };

  const hpPct = Math.max(0, Math.min(1, stats.hp / Math.max(1, stats.hpMax)));
  const xpPct = Math.max(0, Math.min(1, stats.xp / Math.max(1, stats.xpToNext)));
  const levelPct = Math.max(0, Math.min(1, stats.levelXp / Math.max(1, stats.levelXpToNext)));
  const questPct = Math.max(0, Math.min(1, stats.activeQuestProgress / Math.max(1, stats.activeQuestTarget)));
  const apexPct = Math.max(0, Math.min(1, stats.apexHp / Math.max(1, stats.apexHpMax)));
  const downed = Boolean(stats.downed || stats.dead);
  const reviveTime = stats.reviveTime || stats.respawnTime || 0;
  const downs = stats.downs || stats.deaths || 0;
  const engine = engineRef.current;
  const shopSkins = getSkinsForForm(shopForm);

  return (
    <main className="efNextPlay">
      <canvas ref={canvasRef} className="efNextCanvas" />
      <div className="efNextHud">
        <b>EvoFish Next</b>
        <span>{EVOFISH_NEXT_VERSION}</span>
        <span>LV {stats.level} · Tier {stats.tier} · {stats.formName}</span>
        <span>{stats.skinName}</span>
        <span>Zone {stats.zoneName} · Risk {stats.zoneRisk} · Reward x{stats.zoneRewardBoost.toFixed(2)}</span>
        <span>Mass {stats.mass.toFixed(2)} · Kills {stats.kills} · Downs {downs}</span>
        <span>Жемчуг {stats.pearls} · Кораллы {stats.corals} · Mut {stats.mutationLevel}</span>
        {stats.craftBarrierT > 0 || stats.craftBiteBoostT > 0 || stats.craftSonarT > 0 ? (
          <span>Craft: BARRIER {stats.craftBarrierT.toFixed(0)} · BITE {stats.craftBiteBoostT.toFixed(0)} · SONAR {stats.craftSonarT.toFixed(0)}</span>
        ) : null}
        {stats.apexAlive ? (
          <>
            <span>APEX {stats.apexName} {Math.round(stats.apexHp)} / {Math.round(stats.apexHpMax)}</span>
            <i><em className="apex" style={{ width: `${apexPct * 100}%` }} /></i>
          </>
        ) : (
          <span>APEX cleared</span>
        )}
        <span>HP {Math.round(stats.hp)} / {Math.round(stats.hpMax)}</span>
        <i><em style={{ width: `${hpPct * 100}%` }} /></i>
        <span>Tier XP {Math.round(stats.xp)} / {Math.round(stats.xpToNext)}</span>
        <i><em className="xp" style={{ width: `${xpPct * 100}%` }} /></i>
        <span>Level XP {Math.round(stats.levelXp)} / {Math.round(stats.levelXpToNext)}</span>
        <i><em className="level" style={{ width: `${levelPct * 100}%` }} /></i>
        <span>Quest {stats.completedQuests}: {stats.activeQuestTitle}</span>
        <span>{Math.floor(stats.activeQuestProgress)} / {Math.floor(stats.activeQuestTarget)}</span>
        <i><em className="quest" style={{ width: `${questPct * 100}%` }} /></i>
        <span>{stats.lastEvent}</span>
      </div>

      {activePanel ? (
        <div className="efGamePanel">
          <div className="efPanelHead">
            <b>{activePanel === "craft" ? "Craft" : activePanel === "mutations" ? "Mutations" : activePanel === "quests" ? "Quests" : "Shop"}</b>
            <button onClick={() => setActivePanel(null)}>×</button>
          </div>

          {activePanel === "craft" ? NEXT_CRAFT_RECIPES.map((recipe) => {
            const canUse = engine ? canCraftRecipe(engine, recipe.id) : false;
            return (
              <button key={recipe.id} className="efPanelItem" disabled={!canUse} onClick={() => craftRecipe(recipe.id)}>
                <b>{recipe.name}<span>{getCraftCostLabel(recipe.cost)}</span></b>
                <small>{recipe.description}</small>
                <em>{recipe.duration ? `${recipe.duration} сек` : "instant"}</em>
              </button>
            );
          }) : null}

          {activePanel === "mutations" ? NEXT_MUTATIONS.map((mutation) => {
            const level = getMutationLevel(saveState.mutations, mutation.id);
            const canBuy = canBuyMutation(liveSave, mutation.id);
            return (
              <button key={mutation.id} className="efPanelItem" disabled={!canBuy} onClick={() => buyMutationLevel(mutation.id)}>
                <b>{mutation.name}<span>LV {level}/{mutation.maxLevel}</span></b>
                <small>{mutation.description}</small>
                <em>{level >= mutation.maxLevel ? "MAX" : `${mutation.coralCost} коралл`}</em>
              </button>
            );
          }) : null}

          {activePanel === "quests" ? NEXT_QUESTS.map((quest) => {
            const current = Math.min(quest.target, questValue(stats, quest));
            const done = current >= quest.target || Boolean(saveState.quests.completed[quest.id]);
            return (
              <div key={quest.id} className={`efQuestItem ${done ? "done" : ""}`}>
                <b>{quest.title}<span>{Math.floor(current)} / {quest.target}</span></b>
                <small>{quest.description}</small>
                <em>Reward: {quest.reward.xp} XP · {quest.reward.pearls} жемчуг{quest.reward.corals ? ` · ${quest.reward.corals} коралл` : ""}</em>
              </div>
            );
          }) : null}

          {activePanel === "shop" ? (
            <div className="efShopPanel">
              <p>Баланс: {stats.pearls} жемчуг · {stats.corals} кораллы</p>
              <div className="efShopTabs">
                {FORM_ORDER.map((formId) => (
                  <button key={formId} className={shopForm === formId ? "active" : ""} onClick={() => setShopForm(formId)}>
                    {EVOFISH_FORMS[formId].name}
                  </button>
                ))}
              </div>
              <div className="efShopGrid">
                {shopSkins.map((skinDef) => {
                  const owned = isSkinOwned(liveSave, skinDef.id);
                  const equipped = liveSave.loadout.equippedSkinId === skinDef.id;
                  const usable = canUseSkinInNext(liveSave, skinDef);
                  const canBuy = canBuySkin(liveSave, skinDef.id);
                  const locks = getSkinUnlockReasons(liveSave, skinDef);
                  const canAct = !equipped && (owned ? usable : canBuy);
                  const label = equipped
                    ? "Надето"
                    : owned && usable
                      ? "Надеть"
                      : canBuy
                        ? "Купить"
                        : lockLabel(locks);
                  const previewForm = skinDef.form === "any" ? shopForm : skinDef.form;

                  return (
                    <button key={skinDef.id} className={`efShopCard ${equipped ? "equipped" : ""}`} disabled={!canAct} onClick={() => applySkinAction(skinDef.id)}>
                      <SkinPreview skin={skinDef} form={previewForm} size="sm" />
                      <b>{skinDef.name}</b>
                      <small>{skinPriceLabel(skinDef)}</small>
                      <em>{label}</em>
                    </button>
                  );
                })}
              </div>
              <Link to="/game/next/skins">Открыть полный Skin Lab</Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {downed ? <div className="efNextRevive">Возрождение через {reviveTime.toFixed(1)} сек</div> : null}
      <div className="efNextHelp">Next: zones, families, Shop, Craft, Mutations, Quests, Apex, mini-map и revive.</div>
      <div className="efNextControls">
        <button disabled={downed} onPointerDown={(event) => { event.preventDefault(); inputRef.current.bite = true; }}>BITE</button>
        <button disabled={downed} onPointerDown={(event) => { event.preventDefault(); inputRef.current.dash = true; }}>DASH</button>
      </div>
      <div className="efNextLinks">
        <button onClick={() => togglePanel("craft")}>Craft</button>
        <button onClick={() => togglePanel("mutations")}>Mut</button>
        <button onClick={() => togglePanel("quests")}>Quests</button>
        <button onClick={() => togglePanel("shop")}>Shop</button>
        <Link to="/game">Playable</Link>
      </div>
      <style>{`
        .efNextPlay{position:fixed;inset:0;overflow:hidden;background:#031827;color:#e7f2ff;touch-action:none}.efNextCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}.efNextHud{position:absolute;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));z-index:3;display:grid;gap:3px;padding:12px 14px;border-radius:20px;background:rgba(2,16,27,.62);border:1px solid rgba(150,230,255,.15);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 14px 40px rgba(0,0,0,.26);max-width:min(330px,calc(100vw - 24px));max-height:58vh;overflow:auto;box-sizing:border-box}.efNextHud b{font-size:13px}.efNextHud span{font-size:11px;color:rgba(231,242,255,.76)}.efNextHud i{display:block;width:166px;max-width:100%;height:5px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efNextHud em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(110,255,180,.95),rgba(120,240,255,.85))}.efNextHud em.apex{background:linear-gradient(90deg,rgba(255,90,90,.95),rgba(255,220,120,.92))}.efNextHud em.xp{background:linear-gradient(90deg,rgba(255,220,120,.95),rgba(255,160,90,.85))}.efNextHud em.level{background:linear-gradient(90deg,rgba(180,140,255,.95),rgba(120,240,255,.85))}.efNextHud em.quest{background:linear-gradient(90deg,rgba(255,240,160,.95),rgba(180,140,255,.85))}.efNextRevive{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;padding:18px 22px;border-radius:24px;background:rgba(2,16,27,.78);border:1px solid rgba(255,120,120,.22);box-shadow:0 22px 70px rgba(0,0,0,.34);font-size:18px;font-weight:1000;color:#ffd0d0;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.efNextHelp{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3;max-width:min(640px,calc(100vw - 24px));padding:10px 13px;border-radius:999px;background:rgba(2,16,27,.48);border:1px solid rgba(150,230,255,.12);font-size:12px;text-align:center;color:rgba(231,242,255,.76);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efNextLinks{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:8;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efNextLinks a,.efNextLinks button{min-height:34px;display:inline-flex;align-items:center;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(150,230,255,.14);color:#e7f2ff;text-decoration:none;font-size:12px;font-weight:900}.efNextControls{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:5;display:flex;gap:10px}.efNextControls button{width:78px;height:78px;border-radius:999px;border:1px solid rgba(150,230,255,.22);background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.12));box-shadow:0 14px 38px rgba(0,0,0,.28);color:#e7f2ff;font-weight:1000;letter-spacing:.04em;touch-action:manipulation}.efNextControls button:first-child{background:linear-gradient(180deg,rgba(255,110,110,.24),rgba(255,90,90,.12))}.efNextControls button:disabled{opacity:.45}.efGamePanel{position:absolute;right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 46px);z-index:9;width:min(350px,calc(100vw - 24px));max-height:62vh;overflow:auto;padding:12px;border-radius:22px;background:rgba(2,16,27,.88);border:1px solid rgba(150,230,255,.18);box-shadow:0 22px 70px rgba(0,0,0,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.efPanelHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.efPanelHead b{font-size:14px}.efPanelHead button{width:30px;height:30px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#e7f2ff;font-size:18px}.efPanelItem,.efQuestItem{width:100%;display:grid;gap:4px;text-align:left;margin-top:8px;padding:10px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;box-sizing:border-box}.efPanelItem:disabled{opacity:.52}.efPanelItem b,.efQuestItem b{display:flex;justify-content:space-between;gap:10px;font-size:12px}.efPanelItem b span,.efQuestItem b span{color:rgba(120,240,255,.86)}.efPanelItem small,.efQuestItem small,.efShopPanel p{color:rgba(231,242,255,.66);line-height:1.35;margin:0}.efPanelItem em,.efQuestItem em{font-style:normal;color:#fff3a0;font-size:11px;font-weight:950}.efQuestItem.done{border-color:rgba(110,255,180,.22);background:rgba(110,255,180,.06)}.efShopPanel{display:grid;gap:10px}.efShopPanel a{min-height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(120,240,255,.12);border:1px solid rgba(120,240,255,.20);color:#e7f2ff;text-decoration:none;font-weight:950}.efShopTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efShopTabs button{min-height:32px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;font-size:11px;font-weight:950}.efShopTabs button.active{border-color:rgba(120,240,255,.28);background:rgba(120,240,255,.12)}.efShopGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efShopCard{display:grid;gap:5px;padding:8px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055);color:#e7f2ff;text-align:left}.efShopCard:disabled{opacity:.56}.efShopCard.equipped{border-color:rgba(110,255,180,.24);background:rgba(110,255,180,.06)}.efShopCard .efSkinPreview svg{border-radius:12px}.efShopCard b{font-size:11px}.efShopCard small{font-size:10px;color:rgba(231,242,255,.60)}.efShopCard em{font-size:10px;font-style:normal;color:#fff3a0;font-weight:950}@media(max-width:760px){.efNextHud{max-width:min(232px,calc(100vw - 24px));max-height:46vh;padding:10px 12px}.efNextLinks{left:max(12px,env(safe-area-inset-left));right:auto;top:auto;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 96px);justify-content:flex-start;max-width:calc(100vw - 188px);gap:6px}.efNextLinks a,.efNextLinks button{min-height:31px;padding:0 9px;font-size:10px}.efNextHelp{left:max(12px,env(safe-area-inset-left));right:max(190px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));transform:none;text-align:left;font-size:11px;line-height:1.35;border-radius:22px}.efNextControls button{width:74px;height:74px}.efNextRevive{font-size:15px;white-space:nowrap}.efGamePanel{top:calc(max(12px,env(safe-area-inset-top)) + 44px);right:max(10px,env(safe-area-inset-right));width:min(304px,calc(100vw - 20px));max-height:56vh}.efShopGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>
    </main>
  );
}
