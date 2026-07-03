import React, { useEffect, useRef, useState } from "react";
import { Link } from "../../router";
import type { NextEngineState, NextEngineStats, NextFishEntity, NextInputState } from "../core/engineTypes";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import { getCraftCostLabel, NEXT_CRAFT_RECIPES } from "../content/craft";
import { EVOFISH_FORMS } from "../content/forms";
import { getMutationLevel, NEXT_MUTATIONS } from "../content/mutations";
import { NEXT_QUESTS, type NextQuestDefinition } from "../content/quests";
import { canUseSkinInNext, getSkinUnlockReasons } from "../content/skinUnlockRules";
import { EVOFISH_SKIN_BY_ID, getSkinsForForm } from "../content/skins";
import { NEXT_MAP_ZONES } from "../content/zones";
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

type NextPanel = "menu" | "map" | "craft" | "mutations" | "quests" | "shop" | "settings" | null;

type ViewSettings = {
  zoom: number;
  autoZoom: boolean;
};

type CanvasViewportState = {
  width: number;
  height: number;
  dpr: number;
};

const FORM_ORDER: EvoFishFormId[] = ["fish", "shark", "megalodon"];
const VIEW_SETTINGS_KEY = "evofish_next_view_settings_v1";
const DEFAULT_VIEW_SETTINGS: ViewSettings = { zoom: 0.82, autoZoom: true };
const DEFAULT_VIEWPORT: CanvasViewportState = { width: 1, height: 1, dpr: 1 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function viewportSize() {
  const visual = window.visualViewport;
  const width = Math.max(1, Math.round(visual?.width || window.innerWidth || document.documentElement.clientWidth || 1));
  const height = Math.max(1, Math.round(visual?.height || window.innerHeight || document.documentElement.clientHeight || 1));
  return { width, height };
}

function loadViewSettings(): ViewSettings {
  try {
    const raw = localStorage.getItem(VIEW_SETTINGS_KEY);
    if (!raw) return DEFAULT_VIEW_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ViewSettings>;
    return {
      zoom: clamp(Number(parsed.zoom || DEFAULT_VIEW_SETTINGS.zoom), 0.56, 1.18),
      autoZoom: parsed.autoZoom !== false
    };
  } catch {
    return DEFAULT_VIEW_SETTINGS;
  }
}

function saveViewSettings(settings: ViewSettings) {
  try {
    localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // view settings are optional
  }
}

function autoZoomForMass(mass: number) {
  return clamp(1.04 - Math.log(Math.max(1, mass)) * 0.13, 0.58, 1.06);
}

function autoZoomForEngine(engine: NextEngineState) {
  return autoZoomForMass(engine.player.mass);
}

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

function panelTitle(panel: Exclude<NextPanel, null>) {
  if (panel === "menu") return "Menu";
  if (panel === "map") return "World Map";
  if (panel === "craft") return "Craft";
  if (panel === "mutations") return "Mutations";
  if (panel === "quests") return "Quests";
  if (panel === "shop") return "Shop";
  return "Settings";
}

function enemyMapColor(enemy: NextFishEntity) {
  if (enemy.aiType === "apex") return "#ffd86d";
  if (enemy.aiType === "brute") return "#ff6e6e";
  if (enemy.aiType === "hunter") return "#ffb45a";
  if (enemy.aiType === "neutral") return "#78f0ff";
  return "#96e6ff";
}

function enemyMapRadius(enemy: NextFishEntity) {
  if (enemy.aiType === "apex") return 34;
  if (enemy.aiType === "brute") return 22;
  if (enemy.aiType === "hunter") return 17;
  return 13;
}

export function NextPlaytest() {
  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<NextEngineState | null>(null);
  const viewportRef = useRef<CanvasViewportState>(DEFAULT_VIEWPORT);
  const settingsRef = useRef<ViewSettings>(loadViewSettings());
  const inputRef = useRef<NextInputState>({ pointerX: 0, pointerY: 0, down: false, bite: false, dash: false });
  const [saveState, setSaveState] = useState(() => loadEvoFishNextSave());
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => settingsRef.current);
  const [uiLocked, setUiLocked] = useState(false);
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
    settingsRef.current = viewSettings;
    saveViewSettings(viewSettings);
  }, [viewSettings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const html = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById("root") || document.getElementById("app");
    const previous = {
      htmlOverflow: html.style.overflow,
      htmlBackground: html.style.background,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyMargin: body.style.margin,
      bodyBackground: body.style.background,
      bodyTouchAction: body.style.touchAction,
      appMinHeight: appRoot?.style.minHeight || "",
      appBackground: appRoot?.style.background || ""
    };

    let live = true;
    let resizeFrame = 0;
    let last = performance.now();
    let saveTimer = 0;
    const input = inputRef.current;
    const engine = createNextWorld(skin, saveState.progress, saveState.economy, saveState.quests, saveState.mutations);
    engineRef.current = engine;

    const lockDocument = () => {
      html.style.overflow = "hidden";
      html.style.background = "#031827";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.inset = "0";
      body.style.width = "100%";
      body.style.height = "100%";
      body.style.margin = "0";
      body.style.background = "#031827";
      body.style.touchAction = "none";
      if (appRoot) {
        appRoot.style.minHeight = "100dvh";
        appRoot.style.background = "#031827";
      }
    };

    const resize = () => {
      if (!live) return;
      lockDocument();
      const { width, height } = viewportSize();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const pixelWidth = Math.max(1, Math.floor(width * dpr));
      const pixelHeight = Math.max(1, Math.floor(height * dpr));

      root.style.setProperty("--ef-vw", `${width}px`);
      root.style.setProperty("--ef-vh", `${height}px`);
      html.style.setProperty("--ef-vw", `${width}px`);
      html.style.setProperty("--ef-vh", `${height}px`);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      viewportRef.current = { width, height, dpr };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
    };

    const scheduleResize = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
      window.setTimeout(resize, 80);
      window.setTimeout(resize, 260);
      window.setTimeout(resize, 620);
    };

    const pointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      input.pointerX = event.clientX - rect.left;
      input.pointerY = event.clientY - rect.top;
    };

    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      input.down = true;
      pointer(event);
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      event.preventDefault();
      pointer(event);
    };
    const onUp = (event?: PointerEvent) => {
      event?.preventDefault();
      input.down = false;
    };

    resize();
    setStats({ ...engine.stats });

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleResize) : null;
    observer?.observe(root);
    observer?.observe(canvas);

    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", scheduleResize, { passive: true });
    const screenOrientation = typeof screen !== "undefined" ? screen.orientation : null;
    screenOrientation?.addEventListener("change", scheduleResize);

    canvas.addEventListener("pointerdown", onDown, { passive: false });
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp, { passive: false });
    canvas.addEventListener("pointercancel", onUp, { passive: false });

    const loop = (now: number) => {
      if (!live) return;
      const current = viewportSize();
      if (Math.abs(current.width - viewportRef.current.width) > 1 || Math.abs(current.height - viewportRef.current.height) > 1) resize();

      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const settings = settingsRef.current;
      const zoom = settings.autoZoom ? autoZoomForEngine(engine) : settings.zoom;
      const viewport = {
        width: viewportRef.current.width,
        height: viewportRef.current.height,
        zoom,
        quality: "balanced" as const
      };

      ctx.setTransform(viewportRef.current.dpr, 0, 0, viewportRef.current.dpr, 0, 0);
      ctx.clearRect(0, 0, viewport.width, viewport.height);
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
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      saveEvoFishNextProgress(engine);
      if (engineRef.current === engine) engineRef.current = null;
      observer?.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("scroll", scheduleResize);
      screenOrientation?.removeEventListener("change", scheduleResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      html.style.overflow = previous.htmlOverflow;
      html.style.background = previous.htmlBackground;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.inset = previous.bodyInset;
      body.style.width = previous.bodyWidth;
      body.style.height = previous.bodyHeight;
      body.style.margin = previous.bodyMargin;
      body.style.background = previous.bodyBackground;
      body.style.touchAction = previous.bodyTouchAction;
      if (appRoot) {
        appRoot.style.minHeight = previous.appMinHeight;
        appRoot.style.background = previous.appBackground;
      }
    };
  }, []);

  const togglePanel = (panel: Exclude<NextPanel, null>) => {
    if (uiLocked) return;
    setActivePanel((current) => current === panel ? null : panel);
  };

  const lockUi = () => {
    setActivePanel(null);
    setUiLocked(true);
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

  const setZoom = (zoom: number) => {
    setViewSettings((current) => ({ ...current, zoom: clamp(zoom, 0.56, 1.18), autoZoom: false }));
  };

  const hpPct = Math.max(0, Math.min(1, stats.hp / Math.max(1, stats.hpMax)));
  const xpPct = Math.max(0, Math.min(1, stats.xp / Math.max(1, stats.xpToNext)));
  const questPct = Math.max(0, Math.min(1, stats.activeQuestProgress / Math.max(1, stats.activeQuestTarget)));
  const apexPct = Math.max(0, Math.min(1, stats.apexHp / Math.max(1, stats.apexHpMax)));
  const downed = Boolean(stats.downed || stats.dead);
  const reviveTime = stats.reviveTime || stats.respawnTime || 0;
  const downs = stats.downs || stats.deaths || 0;
  const engine = engineRef.current;
  const shopSkins = getSkinsForForm(shopForm);
  const worldWidth = engine?.config.width || 2800;
  const worldHeight = engine?.config.height || 1800;
  const mapApex = engine?.enemies.find((enemy) => enemy.aiType === "apex");

  return (
    <main ref={rootRef} className={`efNextPlay ${uiLocked ? "locked" : ""}`} onContextMenu={(event) => event.preventDefault()}>
      <canvas ref={canvasRef} className="efNextCanvas" />

      {uiLocked ? (
        <div className="efLockedHud">
          <b>LOCKED</b>
          <span>LV {stats.level} · HP {Math.round(stats.hp)} / {Math.round(stats.hpMax)}</span>
        </div>
      ) : (
        <div className="efNextHud">
          <b>EvoFish Next</b>
          <span>LV {stats.level} · Tier {stats.tier} · {stats.formName}</span>
          <span>HP {Math.round(stats.hp)} / {Math.round(stats.hpMax)}</span>
          <i><em style={{ width: `${hpPct * 100}%` }} /></i>
          <span>Zone {stats.zoneName} · Risk {stats.zoneRisk}</span>
          <span>Mass {stats.mass.toFixed(2)} · Kills {stats.kills} · Downs {downs}</span>
          <span>Жемчуг {stats.pearls} · Кораллы {stats.corals}</span>
          {stats.apexAlive ? (
            <>
              <span>APEX {Math.round(stats.apexHp)} / {Math.round(stats.apexHpMax)}</span>
              <i><em className="apex" style={{ width: `${apexPct * 100}%` }} /></i>
            </>
          ) : null}
          <span>Tier XP {Math.round(stats.xp)} / {Math.round(stats.xpToNext)}</span>
          <i><em className="xp" style={{ width: `${xpPct * 100}%` }} /></i>
          <span>Quest: {stats.activeQuestTitle}</span>
          <i><em className="quest" style={{ width: `${questPct * 100}%` }} /></i>
        </div>
      )}

      {!uiLocked && activePanel ? (
        <div className={`efGamePanel ${activePanel === "map" ? "mapPanel" : ""}`}>
          <div className="efPanelHead">
            <b>{panelTitle(activePanel)}</b>
            <button onClick={() => setActivePanel(null)}>×</button>
          </div>

          {activePanel === "menu" ? (
            <div className="efMenuGrid">
              <button onClick={() => setActivePanel("craft")}>Craft</button>
              <button onClick={() => setActivePanel("mutations")}>Mutations</button>
              <button onClick={() => setActivePanel("quests")}>Quests</button>
              <button onClick={() => setActivePanel("shop")}>Shop</button>
              <button onClick={() => setActivePanel("settings")}>Settings</button>
              <button onClick={lockUi}>Lock UI</button>
            </div>
          ) : null}

          {activePanel === "map" ? (
            <div className="efFullMapPanel">
              <div className="efWorldMapFrame">
                <svg viewBox={`0 0 ${worldWidth} ${worldHeight}`} className="efWorldMapSvg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width={worldWidth} height={worldHeight} fill="rgba(2,16,27,.72)" stroke="rgba(150,230,255,.28)" strokeWidth="12" />
                  {NEXT_MAP_ZONES.map((zone) => (
                    <g key={zone.id}>
                      <circle cx={zone.x} cy={zone.y} r={zone.radius} fill={zone.color} stroke={zone.id === stats.zoneId ? "rgba(255,255,255,.78)" : "rgba(255,255,255,.22)"} strokeWidth={zone.id === stats.zoneId ? 16 : 8} />
                      <text x={zone.x} y={zone.y} textAnchor="middle" fill="rgba(231,242,255,.58)" fontSize="76" fontWeight="900">{zone.name}</text>
                    </g>
                  ))}
                  {engine?.events?.map((event) => (
                    <circle key={event.id} cx={event.x} cy={event.y} r="38" fill="rgba(255,220,120,.95)" stroke="rgba(255,255,255,.78)" strokeWidth="8" />
                  ))}
                  {engine?.enemies.map((enemy) => (
                    <circle key={enemy.id} cx={enemy.x} cy={enemy.y} r={enemyMapRadius(enemy)} fill={enemyMapColor(enemy)} opacity={enemy.aiType === "apex" ? 1 : 0.78} stroke={enemy.aiType === "apex" ? "rgba(255,90,90,.92)" : "rgba(2,16,27,.80)"} strokeWidth={enemy.aiType === "apex" ? 10 : 4} />
                  ))}
                  {engine && mapApex ? <line x1={engine.player.x} y1={engine.player.y} x2={mapApex.x} y2={mapApex.y} stroke="rgba(255,220,120,.62)" strokeWidth="8" strokeDasharray="26 18" /> : null}
                  {engine ? <circle cx={engine.player.x} cy={engine.player.y} r="42" fill="rgba(110,255,180,.98)" stroke="rgba(255,255,255,.92)" strokeWidth="10" /> : null}
                </svg>
              </div>
              <div className="efMapLegend">
                <span><b className="player" />Player</span>
                <span><b className="apex" />Apex</span>
                <span><b className="hunter" />Hunter</span>
                <span><b className="event" />Event</span>
              </div>
            </div>
          ) : null}

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

          {activePanel === "settings" ? (
            <div className="efSettingsPanel">
              <div className="efSettingRow">
                <span>Auto Zoom</span>
                <button className={viewSettings.autoZoom ? "active" : ""} onClick={() => setViewSettings((current) => ({ ...current, autoZoom: !current.autoZoom }))}>
                  {viewSettings.autoZoom ? "ON" : "OFF"}
                </button>
              </div>
              <label className="efZoomControl">
                <span>Manual Zoom: {viewSettings.zoom.toFixed(2)}x</span>
                <input type="range" min="0.56" max="1.18" step="0.02" value={viewSettings.zoom} onChange={(event) => setZoom(Number(event.currentTarget.value))} />
              </label>
              <div className="efZoomPresets">
                <button onClick={() => setZoom(0.62)}>Wide</button>
                <button onClick={() => setZoom(0.82)}>Balanced</button>
                <button onClick={() => setZoom(1.06)}>Close</button>
              </div>
            </div>
          ) : null}

          {activePanel === "shop" ? (
            <div className="efShopPanel">
              <p>Баланс: {stats.pearls} жемчуг · {stats.corals} кораллы</p>
              <div className="efShopTabs">
                {FORM_ORDER.map((formId) => (
                  <button key={formId} className={shopForm === formId ? "active" : ""} onClick={() => setShopForm(formId)}>{EVOFISH_FORMS[formId].name}</button>
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
                  const label = equipped ? "Надето" : owned && usable ? "Надеть" : canBuy ? "Купить" : lockLabel(locks);
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
              <Link to="/game/next/skins">Полный Skin Lab</Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {downed ? <div className="efNextRevive">Возрождение через {reviveTime.toFixed(1)} сек</div> : null}
      <div className="efNextControls">
        <button disabled={downed} onPointerDown={(event) => { event.preventDefault(); inputRef.current.bite = true; }}>BITE</button>
        <button disabled={downed} onPointerDown={(event) => { event.preventDefault(); inputRef.current.dash = true; }}>DASH</button>
      </div>
      {!uiLocked ? (
        <div className="efQuickBar">
          <button onClick={() => togglePanel("map")}>Map</button>
          <button className="primary" onClick={() => togglePanel("menu")}>Menu</button>
          <button onClick={lockUi}>Lock</button>
        </div>
      ) : (
        <button className="efUnlockPill" onClick={() => setUiLocked(false)}>🔒 Unlock UI</button>
      )}
      <style>{`
        .efNextPlay{position:fixed!important;left:0!important;top:0!important;width:var(--ef-vw,100vw)!important;height:var(--ef-vh,100dvh)!important;min-width:var(--ef-vw,100vw)!important;min-height:var(--ef-vh,100dvh)!important;overflow:hidden;background:#031827;color:#e7f2ff;touch-action:none;overscroll-behavior:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;contain:layout size paint;z-index:9999;box-sizing:border-box}.efNextCanvas{position:absolute;left:0;top:0;width:var(--ef-vw,100vw)!important;height:var(--ef-vh,100dvh)!important;display:block;background:#031827;touch-action:none;box-sizing:border-box}.efNextHud,.efLockedHud{position:absolute;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));z-index:3;display:grid;gap:3px;padding:11px 13px;border-radius:20px;background:linear-gradient(180deg,rgba(5,31,50,.68),rgba(2,16,27,.54));border:1px solid rgba(150,230,255,.15);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 14px 40px rgba(0,0,0,.24);max-width:min(310px,calc(var(--ef-vw,100vw) - 24px));max-height:44vh;overflow:auto;box-sizing:border-box}.efLockedHud{padding:10px 12px;gap:2px;max-width:170px}.efNextHud b,.efLockedHud b{font-size:13px}.efNextHud span,.efLockedHud span{font-size:10.8px;color:rgba(231,242,255,.76)}.efNextHud i{display:block;width:160px;max-width:100%;height:5px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efNextHud em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(110,255,180,.95),rgba(120,240,255,.85))}.efNextHud em.apex{background:linear-gradient(90deg,rgba(255,90,90,.95),rgba(255,220,120,.92))}.efNextHud em.xp{background:linear-gradient(90deg,rgba(255,220,120,.95),rgba(255,160,90,.85))}.efNextHud em.quest{background:linear-gradient(90deg,rgba(255,240,160,.95),rgba(180,140,255,.85))}.efNextRevive{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;padding:18px 22px;border-radius:24px;background:rgba(2,16,27,.78);border:1px solid rgba(255,120,120,.22);box-shadow:0 22px 70px rgba(0,0,0,.34);font-size:18px;font-weight:1000;color:#ffd0d0;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.efQuickBar{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 18px);z-index:8;display:flex;gap:8px;padding:8px;border-radius:24px;background:rgba(2,16,27,.42);border:1px solid rgba(150,230,255,.11);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efQuickBar button,.efUnlockPill{min-width:72px;min-height:38px;display:inline-flex;align-items:center;justify-content:center;padding:0 13px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(150,230,255,.16);color:#e7f2ff;text-decoration:none;font-size:11px;font-weight:1000;box-shadow:0 10px 26px rgba(0,0,0,.18)}.efQuickBar button.primary{background:rgba(120,240,255,.14);border-color:rgba(120,240,255,.26)}.efUnlockPill{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 18px);z-index:9;min-width:136px;background:rgba(255,220,120,.14);border-color:rgba(255,220,120,.28);color:#fff3c6}.efNextControls{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:5;display:flex;gap:12px}.efNextControls button{width:78px;height:78px;border-radius:999px;border:1px solid rgba(150,230,255,.22);background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.12));box-shadow:0 14px 38px rgba(0,0,0,.28);color:#e7f2ff;font-weight:1000;letter-spacing:.04em;touch-action:manipulation}.efNextControls button:first-child{background:linear-gradient(180deg,rgba(255,110,110,.24),rgba(255,90,90,.12))}.efNextControls button:disabled{opacity:.45}.efGamePanel{position:absolute;right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 46px);z-index:9;width:min(350px,calc(var(--ef-vw,100vw) - 24px));max-height:62vh;overflow:auto;padding:12px;border-radius:22px;background:rgba(2,16,27,.88);border:1px solid rgba(150,230,255,.18);box-shadow:0 22px 70px rgba(0,0,0,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-sizing:border-box}.efGamePanel.mapPanel{left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));width:auto;max-height:78vh}.efPanelHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.efPanelHead b{font-size:14px}.efPanelHead button,.efSettingRow button,.efZoomPresets button{border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#e7f2ff;font-weight:950}.efPanelHead button{width:30px;height:30px;font-size:18px}.efMenuGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efMenuGrid button{min-height:46px;border-radius:16px;border:1px solid rgba(150,230,255,.15);background:rgba(255,255,255,.07);color:#e7f2ff;font-weight:1000}.efFullMapPanel{display:grid;gap:10px}.efWorldMapFrame{width:100%;border:1px solid rgba(150,230,255,.16);border-radius:18px;background:rgba(0,0,0,.18);overflow:hidden}.efWorldMapSvg{display:block;width:100%;height:min(58vh,430px)}.efMapLegend{display:flex;gap:10px;flex-wrap:wrap}.efMapLegend span{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:rgba(231,242,255,.76);font-weight:850}.efMapLegend b{width:10px;height:10px;border-radius:99px;display:inline-block}.efMapLegend b.player{background:#6effb4}.efMapLegend b.apex{background:#ffd86d}.efMapLegend b.hunter{background:#ffb45a}.efMapLegend b.event{background:#fff3a0}.efPanelItem,.efQuestItem{width:100%;display:grid;gap:4px;text-align:left;margin-top:8px;padding:10px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;box-sizing:border-box}.efPanelItem:disabled{opacity:.52}.efPanelItem b,.efQuestItem b{display:flex;justify-content:space-between;gap:10px;font-size:12px}.efPanelItem b span,.efQuestItem b span{color:rgba(120,240,255,.86)}.efPanelItem small,.efQuestItem small,.efShopPanel p,.efSettingsPanel p,.efFullMapPanel p{color:rgba(231,242,255,.66);line-height:1.35;margin:0}.efPanelItem em,.efQuestItem em{font-style:normal;color:#fff3a0;font-size:11px;font-weight:950}.efQuestItem.done{border-color:rgba(110,255,180,.22);background:rgba(110,255,180,.06)}.efShopPanel,.efSettingsPanel{display:grid;gap:10px}.efShopPanel a{min-height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(120,240,255,.12);border:1px solid rgba(120,240,255,.20);color:#e7f2ff;text-decoration:none;font-weight:950}.efShopTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efShopTabs button{min-height:32px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;font-size:11px;font-weight:950}.efShopTabs button.active,.efSettingRow button.active{border-color:rgba(120,240,255,.28);background:rgba(120,240,255,.12)}.efShopGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efShopCard{display:grid;gap:5px;padding:8px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055);color:#e7f2ff;text-align:left}.efShopCard:disabled{opacity:.56}.efShopCard.equipped{border-color:rgba(110,255,180,.24);background:rgba(110,255,180,.06)}.efShopCard .efSkinPreview svg{border-radius:12px}.efShopCard b{font-size:11px}.efShopCard small{font-size:10px;color:rgba(231,242,255,.60)}.efShopCard em{font-size:10px;font-style:normal;color:#fff3a0;font-weight:950}.efSettingRow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.055)}.efSettingRow span,.efZoomControl span{font-size:12px;font-weight:900;color:rgba(231,242,255,.84)}.efSettingRow button{min-width:64px;height:30px}.efZoomControl{display:grid;gap:8px;padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.055)}.efZoomControl input{width:100%;accent-color:#78f0ff}.efZoomPresets{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.efZoomPresets button{min-height:34px}@media(max-width:760px){.efNextHud{max-width:min(230px,calc(var(--ef-vw,100vw) - 24px));max-height:38vh;padding:10px 12px}.efLockedHud{max-width:160px}.efQuickBar{left:max(10px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 88px);gap:6px;padding:7px}.efQuickBar button{min-width:58px;min-height:34px;padding:0 10px;font-size:10px}.efNextControls{gap:10px}.efNextControls button{width:72px;height:72px}.efNextRevive{font-size:15px;white-space:nowrap}.efGamePanel{top:calc(max(12px,env(safe-area-inset-top)) + 44px);right:max(10px,env(safe-area-inset-right));width:min(304px,calc(var(--ef-vw,100vw) - 20px));max-height:56vh}.efGamePanel.mapPanel{left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));width:auto;max-height:70vh}.efWorldMapSvg{height:min(52vh,390px)}.efShopGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.efUnlockPill{left:max(10px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 92px);font-size:10px;min-width:128px}}@media(orientation:landscape){.efNextHud{max-height:50vh}.efQuickBar{bottom:max(12px,env(safe-area-inset-bottom))}.efNextControls{bottom:max(12px,env(safe-area-inset-bottom))}.efNextControls button{width:72px;height:72px}.efGamePanel{max-height:78vh}.efGamePanel.mapPanel{max-height:82vh}.efWorldMapSvg{height:min(66vh,440px)}}
      `}</style>
    </main>
  );
}
