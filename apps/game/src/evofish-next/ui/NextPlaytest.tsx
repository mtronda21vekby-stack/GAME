import React, { useEffect, useRef, useState } from "react";
import { Link } from "../../router";
import type { NextEngineState, NextEngineStats, NextFishEntity, NextInputState, NextRenderQuality } from "../core/engineTypes";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import { getCraftCostLabel, NEXT_CRAFT_RECIPES } from "../content/craft";
import { EVOFISH_FORMS } from "../content/forms";
import { getMutationLevel, getMutationTotalLevel, NEXT_MUTATIONS } from "../content/mutations";
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
type ControlMode = "pointer" | "joystick" | "gamepad";
type StickMode = "fixed" | "floating";

type ViewSettings = {
  zoom: number;
  autoZoom: boolean;
  controlMode: ControlMode;
  quality: NextRenderQuality;
  stickMode: StickMode;
  stickSize: number;
  stickSensitivity: number;
};

type CanvasViewportState = {
  width: number;
  height: number;
  dpr: number;
};

type StickState = {
  active: boolean;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
};

const FORM_ORDER: EvoFishFormId[] = ["fish", "shark", "megalodon"];
const VIEW_SETTINGS_KEY = "evofish_next_view_settings_v3";
const TUTORIAL_KEY = "evofish_next_tutorial_done_v1";
const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  zoom: 0.82,
  autoZoom: true,
  controlMode: "pointer",
  quality: "balanced",
  stickMode: "fixed",
  stickSize: 92,
  stickSensitivity: 1
};
const DEFAULT_VIEWPORT: CanvasViewportState = { width: 1, height: 1, dpr: 1 };
const EMPTY_STICK: StickState = { active: false, x: 0, y: 0, baseX: 0, baseY: 0 };
const TUTORIAL_STEPS = [
  { title: "1/5 · Движение", body: "Выбери Touch, Stick или Gamepad. Для телефона лучше Stick. В Settings можно сделать стик fixed или floating." },
  { title: "2/5 · Bite / Dash", body: "BITE атакует и добивает. DASH даёт рывок и короткое окно безопасности." },
  { title: "3/5 · Ресурсы", body: "Собирай жемчуг, кристаллы, perks и artifacts. Кристаллы редкие и нужны для мутаций/скинов." },
  { title: "4/5 · Задания", body: "Открывай Menu → Quests. Daily/Weekly каждый день и неделю дают новые цели." },
  { title: "5/5 · Мутации", body: "При прогрессе появится выбор 1 из 3 мутаций. Мир ставится на паузу, выбор бесплатный." }
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function viewportSize() {
  const visual = window.visualViewport;
  const width = Math.max(1, Math.round(visual?.width || window.innerWidth || document.documentElement.clientWidth || 1));
  const height = Math.max(1, Math.round(visual?.height || window.innerHeight || document.documentElement.clientHeight || 1));
  return { width, height };
}

function normalizeControlMode(value: unknown): ControlMode {
  return value === "joystick" || value === "gamepad" || value === "pointer" ? value : "pointer";
}

function normalizeQuality(value: unknown): NextRenderQuality {
  return value === "low" || value === "high" || value === "balanced" ? value : "balanced";
}

function normalizeStickMode(value: unknown): StickMode {
  return value === "floating" || value === "fixed" ? value : "fixed";
}

function loadViewSettings(): ViewSettings {
  try {
    const raw = localStorage.getItem(VIEW_SETTINGS_KEY);
    if (!raw) return DEFAULT_VIEW_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ViewSettings>;
    return {
      zoom: clamp(Number(parsed.zoom || DEFAULT_VIEW_SETTINGS.zoom), 0.56, 1.18),
      autoZoom: parsed.autoZoom !== false,
      controlMode: normalizeControlMode(parsed.controlMode),
      quality: normalizeQuality(parsed.quality),
      stickMode: normalizeStickMode(parsed.stickMode),
      stickSize: clamp(Number(parsed.stickSize || DEFAULT_VIEW_SETTINGS.stickSize), 76, 132),
      stickSensitivity: clamp(Number(parsed.stickSensitivity || DEFAULT_VIEW_SETTINGS.stickSensitivity), 0.65, 1.55)
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

function tutorialDone() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

function setTutorialDone(done: boolean) {
  try {
    if (done) localStorage.setItem(TUTORIAL_KEY, "1");
    else localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    // tutorial state is optional
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
  if (quest.metric === "resources") return stats.resourcesCollected || 0;
  if (quest.metric === "craft") return stats.craftUses || 0;
  if (quest.metric === "mutations") return Math.max(stats.mutationPurchases || 0, stats.mutationLevel || 0);
  if (quest.metric === "perks") return stats.perksPicked || 0;
  if (quest.metric === "artifacts") return stats.artifactsFound || 0;
  return 0;
}

function formatNumber(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function skinPriceLabel(skin: EvoFishSkinDefinition) {
  if (skin.unlock.type === "free") return "Бесплатно";
  if (skin.unlock.type === "currency") {
    const icon = skin.unlock.currency === "pearls" ? "🦪" : "💎";
    const label = skin.unlock.currency === "pearls" ? "жемчуг" : "кристаллы";
    return `${icon} ${formatNumber(skin.unlock.amount)} ${label}`;
  }
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

function gamepadAxis(value: number) {
  return Math.abs(value) < 0.18 ? 0 : value;
}

function qualityDprCap(quality: NextRenderQuality) {
  if (quality === "low") return 1;
  if (quality === "high") return 2;
  return 1.5;
}

function qualityEnemyTarget(quality: NextRenderQuality) {
  if (quality === "low") return 32;
  if (quality === "high") return 52;
  return 42;
}

function stickRadius(settings: ViewSettings) {
  return Math.max(27, settings.stickSize * 0.37);
}

function stickKnobSize(settings: ViewSettings) {
  return Math.max(28, settings.stickSize * 0.35);
}

export function NextPlaytest() {
  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<NextEngineState | null>(null);
  const viewportRef = useRef<CanvasViewportState>(DEFAULT_VIEWPORT);
  const settingsRef = useRef<ViewSettings>(loadViewSettings());
  const stickBaseRef = useRef({ x: 0, y: 0 });
  const inputRef = useRef<NextInputState>({ pointerX: 0, pointerY: 0, down: false, bite: false, dash: false, moveX: 0, moveY: 0 });
  const [saveState, setSaveState] = useState(() => loadEvoFishNextSave());
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => settingsRef.current);
  const [stick, setStick] = useState<StickState>(EMPTY_STICK);
  const [uiLocked, setUiLocked] = useState(false);
  const [activePanel, setActivePanel] = useState<NextPanel>(null);
  const [shopForm, setShopForm] = useState<EvoFishFormId>("fish");
  const [tutorialOpen, setTutorialOpen] = useState(() => !tutorialDone());
  const [tutorialStep, setTutorialStep] = useState(0);
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
    resourcesCollected: 0,
    perksPicked: 0,
    artifactsFound: 0,
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
    window.setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
    if (viewSettings.controlMode !== "joystick") setStick(EMPTY_STICK);
    if (viewSettings.controlMode !== "pointer") {
      inputRef.current.pointerX = 0;
      inputRef.current.pointerY = 0;
    }
    if (viewSettings.controlMode === "pointer") {
      inputRef.current.moveX = 0;
      inputRef.current.moveY = 0;
      inputRef.current.down = false;
    }
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
    const engine = createNextWorld(skin, saveState.progress, saveState.economy, saveState.quests, saveState.mutations, saveState.account, saveState.achievements);
    engine.config.enemyTarget = Math.min(engine.config.enemyTarget, qualityEnemyTarget(settingsRef.current.quality));
    engine.enemies = engine.enemies.slice(0, qualityEnemyTarget(settingsRef.current.quality));
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
      const dpr = Math.max(1, Math.min(qualityDprCap(settingsRef.current.quality), window.devicePixelRatio || 1));
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
      if (settingsRef.current.controlMode !== "pointer") return;
      input.moveX = 0;
      input.moveY = 0;
      input.down = true;
      pointer(event);
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      event.preventDefault();
      if (settingsRef.current.controlMode !== "pointer") return;
      pointer(event);
    };
    const onUp = (event?: PointerEvent) => {
      event?.preventDefault();
      if (settingsRef.current.controlMode !== "pointer") return;
      input.down = false;
    };

    const applyGamepadInput = (settings: ViewSettings) => {
      if (settings.controlMode !== "gamepad") return;
      const pads = typeof navigator !== "undefined" && navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      const pad = pads.find(Boolean);
      if (!pad) {
        input.down = false;
        input.moveX = 0;
        input.moveY = 0;
        return;
      }

      const x = gamepadAxis(pad.axes[0] || 0);
      const y = gamepadAxis(pad.axes[1] || 0);
      const mag = Math.min(1, Math.hypot(x, y));
      input.moveX = clamp(x, -1, 1);
      input.moveY = clamp(y, -1, 1);
      input.down = mag > 0.08;
      if (pad.buttons[0]?.pressed || (pad.buttons[7]?.value || 0) > 0.45) input.bite = true;
      if (pad.buttons[1]?.pressed || pad.buttons[5]?.pressed || (pad.buttons[6]?.value || 0) > 0.45) input.dash = true;
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
      applyGamepadInput(settings);
      const zoom = settings.autoZoom ? autoZoomForEngine(engine) : settings.zoom;
      const viewport = {
        width: viewportRef.current.width,
        height: viewportRef.current.height,
        zoom,
        quality: settings.quality
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

  const resetStick = () => {
    inputRef.current.down = false;
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    stickBaseRef.current = { x: 0, y: 0 };
    setStick(EMPTY_STICK);
  };

  const setControlMode = (controlMode: ControlMode) => {
    resetStick();
    setViewSettings((current) => ({ ...current, controlMode }));
  };

  const updateStickFromBase = (event: React.PointerEvent<HTMLDivElement>, baseX: number, baseY: number) => {
    if (viewSettings.controlMode !== "joystick" || stats.downed || stats.dead) return;
    event.preventDefault();
    const radius = stickRadius(viewSettings);
    const rawX = event.clientX - baseX;
    const rawY = event.clientY - baseY;
    const len = Math.hypot(rawX, rawY);
    const scale = len > radius ? radius / len : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    inputRef.current.moveX = clamp((x / radius) * viewSettings.stickSensitivity, -1, 1);
    inputRef.current.moveY = clamp((y / radius) * viewSettings.stickSensitivity, -1, 1);
    inputRef.current.down = len > 7;
    stickBaseRef.current = { x: baseX, y: baseY };
    setStick({ active: true, x, y, baseX, baseY });
  };

  const updateFixedStick = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    updateStickFromBase(event, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const startFloatingStick = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    stickBaseRef.current = { x: event.clientX, y: event.clientY };
    updateStickFromBase(event, event.clientX, event.clientY);
  };

  const moveFloatingStick = (event: React.PointerEvent<HTMLDivElement>) => {
    const base = stickBaseRef.current;
    if (!base.x && !base.y) return;
    updateStickFromBase(event, base.x, base.y);
  };

  const releaseStick = (event?: React.PointerEvent<HTMLDivElement>) => {
    event?.preventDefault();
    resetStick();
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

  const finishTutorial = () => {
    setTutorialDone(true);
    setTutorialOpen(false);
  };

  const resetTutorial = () => {
    setTutorialDone(false);
    setTutorialStep(0);
    setTutorialOpen(true);
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
  const showJoystick = viewSettings.controlMode === "joystick" && !downed;
  const size = viewSettings.stickSize;
  const knob = stickKnobSize(viewSettings);
  const tutorial = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[0];
  const stickVisualStyle = viewSettings.stickMode === "floating" && stick.active
    ? { width: `${size}px`, height: `${size}px`, left: `${stick.baseX - size / 2}px`, top: `${stick.baseY - size / 2}px`, bottom: "auto" }
    : { width: `${size}px`, height: `${size}px` };

  return (
    <main ref={rootRef} className={`efNextPlay ${uiLocked ? "locked" : ""}`} onContextMenu={(event) => event.preventDefault()}>
      <canvas ref={canvasRef} className="efNextCanvas" />

      <div className={`efNextHud ${uiLocked ? "compact" : ""}`}>
        <div className="efHudTitle"><b>EvoFish Next</b><em>{EVOFISH_NEXT_VERSION}</em></div>
        <div className="efHudChips">
          <span className="level"><b>LV</b>{stats.level}</span>
          <span className="tier"><b>TIER</b>{stats.tier}</span>
          <span className="pearl"><b>🦪</b>{formatNumber(stats.pearls)}</span>
          <span className="coral"><b>💎</b>{formatNumber(stats.corals)}</span>
        </div>
        {!uiLocked ? <span className="efHudLine">{stats.formName} · {stats.skinName} · {viewSettings.quality.toUpperCase()}</span> : <span className="efHudLine lockedText">UI LOCKED · {viewSettings.controlMode.toUpperCase()}</span>}
        <span className="efHudLine">HP {Math.round(stats.hp)} / {Math.round(stats.hpMax)} · Mass {stats.mass.toFixed(2)} · Kills {stats.kills}</span>
        <i><em style={{ width: `${hpPct * 100}%` }} /></i>
        {!uiLocked ? <span className="efHudLine">Zone {stats.zoneName} · Risk {stats.zoneRisk} · Downs {downs}</span> : null}
        {stats.apexAlive && !uiLocked ? (
          <>
            <span className="efHudLine">APEX {Math.round(stats.apexHp)} / {Math.round(stats.apexHpMax)}</span>
            <i><em className="apex" style={{ width: `${apexPct * 100}%` }} /></i>
          </>
        ) : null}
        {!uiLocked ? <span className="efHudLine">Tier XP {Math.round(stats.xp)} / {Math.round(stats.xpToNext)}</span> : null}
        {!uiLocked ? <i><em className="xp" style={{ width: `${xpPct * 100}%` }} /></i> : null}
        <span className="efHudLine questText">Quest: {stats.activeQuestTitle}</span>
        <i><em className="quest" style={{ width: `${questPct * 100}%` }} /></i>
      </div>

      {tutorialOpen && !uiLocked ? (
        <div className="efTutorialCard">
          <b>{tutorial.title}</b>
          <p>{tutorial.body}</p>
          <div>
            <button onClick={() => setTutorialStep((step) => Math.max(0, step - 1))} disabled={tutorialStep <= 0}>Back</button>
            <button className="primary" onClick={() => tutorialStep >= TUTORIAL_STEPS.length - 1 ? finishTutorial() : setTutorialStep((step) => step + 1)}>{tutorialStep >= TUTORIAL_STEPS.length - 1 ? "Finish" : "Next"}</button>
            <button onClick={finishTutorial}>Skip</button>
          </div>
        </div>
      ) : null}

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
            const liveLevel = engine ? getMutationLevel(engine.mutations, mutation.id) : level;
            const canBuy = canBuyMutation(liveSave, mutation.id);
            return (
              <button key={mutation.id} className="efPanelItem" disabled={!canBuy} onClick={() => buyMutationLevel(mutation.id)}>
                <b>{mutation.name}<span>LV {liveLevel}/{mutation.maxLevel}</span></b>
                <small>{mutation.description}</small>
                <em>{liveLevel >= mutation.maxLevel ? "MAX" : `${mutation.coralCost} кристалл`}</em>
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
                <em>Reward: {quest.reward.xp} XP · {quest.reward.pearls} жемчуг{quest.reward.corals ? ` · ${quest.reward.corals} кристалл` : ""}</em>
              </div>
            );
          }) : null}

          {activePanel === "settings" ? (
            <div className="efSettingsPanel">
              <div className="efSettingBlock">
                <b>Управление</b>
                <div className="efControlModes">
                  <button className={viewSettings.controlMode === "pointer" ? "active" : ""} onClick={() => setControlMode("pointer")}>Touch</button>
                  <button className={viewSettings.controlMode === "joystick" ? "active" : ""} onClick={() => setControlMode("joystick")}>Stick</button>
                  <button className={viewSettings.controlMode === "gamepad" ? "active" : ""} onClick={() => setControlMode("gamepad")}>Gamepad</button>
                </div>
                <small>{viewSettings.controlMode === "joystick" ? "Стик работает даже в Lock UI. Тип stick можно сделать Fixed или Floating." : viewSettings.controlMode === "gamepad" ? "Геймпад: левый стик — движение, A/RT — bite, B/RB/LT — dash." : "Touch: веди пальцем по экрану в сторону движения."}</small>
              </div>

              {viewSettings.controlMode === "joystick" ? (
                <div className="efSettingBlock">
                  <b>Stick Tuning</b>
                  <div className="efControlModes two">
                    <button className={viewSettings.stickMode === "fixed" ? "active" : ""} onClick={() => { resetStick(); setViewSettings((current) => ({ ...current, stickMode: "fixed" })); }}>Fixed</button>
                    <button className={viewSettings.stickMode === "floating" ? "active" : ""} onClick={() => { resetStick(); setViewSettings((current) => ({ ...current, stickMode: "floating" })); }}>Floating</button>
                  </div>
                  <label className="efZoomControl"><span>Stick Size: {Math.round(viewSettings.stickSize)}px</span><input type="range" min="76" max="132" step="2" value={viewSettings.stickSize} onChange={(event) => setViewSettings((current) => ({ ...current, stickSize: Number(event.currentTarget.value) }))} /></label>
                  <label className="efZoomControl"><span>Sensitivity: {viewSettings.stickSensitivity.toFixed(2)}x</span><input type="range" min="0.65" max="1.55" step="0.05" value={viewSettings.stickSensitivity} onChange={(event) => setViewSettings((current) => ({ ...current, stickSensitivity: Number(event.currentTarget.value) }))} /></label>
                  <small>Fixed стоит снизу слева. Floating появляется там, где ты нажал на левой зоне экрана.</small>
                </div>
              ) : null}

              <div className="efSettingBlock">
                <b>Quality</b>
                <div className="efControlModes">
                  <button className={viewSettings.quality === "low" ? "active" : ""} onClick={() => setViewSettings((current) => ({ ...current, quality: "low" }))}>Low</button>
                  <button className={viewSettings.quality === "balanced" ? "active" : ""} onClick={() => setViewSettings((current) => ({ ...current, quality: "balanced" }))}>Balanced</button>
                  <button className={viewSettings.quality === "high" ? "active" : ""} onClick={() => setViewSettings((current) => ({ ...current, quality: "high" }))}>High</button>
                </div>
                <small>Low снижает DPR/визуальную нагрузку. High оставляет максимум визуала.</small>
              </div>

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
              <div className="efSettingBlock">
                <b>Tutorial</b>
                <button className="efWideButton" onClick={resetTutorial}>Restart Tutorial</button>
                <small>Повторно покажет первые 5 подсказок.</small>
              </div>
            </div>
          ) : null}

          {activePanel === "shop" ? (
            <div className="efShopPanel">
              <div className="efShopBalance">
                <span><b>🦪</b>{formatNumber(stats.pearls)}<em>жемчуг</em></span>
                <span><b>💎</b>{formatNumber(stats.corals)}<em>кристаллы</em></span>
              </div>
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
                    <button key={skinDef.id} className={`efShopCard ${equipped ? "equipped" : ""} ${skinDef.unlock.type === "currency" && skinDef.unlock.currency === "corals" ? "coralPrice" : ""}`} disabled={!canAct} onClick={() => applySkinAction(skinDef.id)}>
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

      {showJoystick && viewSettings.stickMode === "floating" ? (
        <div className="efStickFloatZone" onPointerDown={startFloatingStick} onPointerMove={moveFloatingStick} onPointerUp={releaseStick} onPointerCancel={releaseStick}>{!stick.active ? <span>FLOAT STICK ZONE</span> : null}</div>
      ) : null}

      {showJoystick && (viewSettings.stickMode === "fixed" || stick.active) ? (
        <div
          className={`efMoveStick ${stick.active ? "active" : ""} ${uiLocked ? "lockedStick" : ""} ${viewSettings.stickMode === "floating" ? "floatStick" : ""}`}
          style={stickVisualStyle}
          onPointerDown={viewSettings.stickMode === "fixed" ? (event) => { event.currentTarget.setPointerCapture(event.pointerId); updateFixedStick(event); } : undefined}
          onPointerMove={viewSettings.stickMode === "fixed" ? updateFixedStick : undefined}
          onPointerUp={viewSettings.stickMode === "fixed" ? releaseStick : undefined}
          onPointerCancel={viewSettings.stickMode === "fixed" ? releaseStick : undefined}
        >
          <span style={{ width: `${knob}px`, height: `${knob}px`, marginLeft: `${-knob / 2}px`, marginTop: `${-knob / 2}px`, transform: `translate(${stick.x}px, ${stick.y}px)` }} />
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
        <button className="efUnlockPill" onClick={() => setUiLocked(false)}>🔒 UI LOCKED</button>
      )}
      <style>{`
        .efNextPlay{position:fixed!important;inset:0!important;width:var(--ef-vw,100vw)!important;height:var(--ef-vh,100dvh)!important;overflow:hidden;background:#031827;color:#e7f2ff;touch-action:none;overscroll-behavior:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;contain:layout size paint;z-index:9999;box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efNextCanvas{position:absolute;inset:0;width:var(--ef-vw,100vw)!important;height:var(--ef-vh,100dvh)!important;display:block;background:#031827;touch-action:none}.efNextHud{position:absolute;left:max(12px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));z-index:3;display:grid;gap:3px;width:min(286px,calc(var(--ef-vw,100vw) - 24px));max-height:34vh;overflow:hidden;padding:9px 10px;border-radius:16px;background:linear-gradient(180deg,rgba(5,31,50,.68),rgba(2,16,27,.52));border:1px solid rgba(150,230,255,.15);backdrop-filter:blur(13px);-webkit-backdrop-filter:blur(13px);box-shadow:0 12px 34px rgba(0,0,0,.22)}.efNextHud.compact{width:min(250px,calc(var(--ef-vw,100vw) - 24px));max-height:118px;padding:7px 9px;gap:2px}.efHudTitle{display:flex;align-items:center;justify-content:space-between;gap:8px}.efHudTitle b{font-size:12px;line-height:1}.efHudTitle em{font-style:normal;font-size:8px;color:rgba(255,243,160,.78);font-weight:1000}.efHudChips,.efShopBalance{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.efHudChips span,.efShopBalance span{min-height:24px;display:flex;align-items:center;justify-content:center;gap:3px;padding:0 5px;border-radius:10px;border:1px solid rgba(255,255,255,.10);font-size:10px;font-weight:1000;background:rgba(255,255,255,.055)}.efHudLine{font-size:9px;color:rgba(231,242,255,.76);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efHudLine.lockedText{color:#fff3a0;font-weight:900}.efNextHud i{display:block;width:100%;height:4px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efNextHud i em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(110,255,180,.95),rgba(120,240,255,.85))}.efNextHud i em.apex{background:linear-gradient(90deg,rgba(255,90,90,.95),rgba(255,220,120,.92))}.efNextHud i em.xp{background:linear-gradient(90deg,rgba(255,220,120,.95),rgba(255,160,90,.85))}.efNextHud i em.quest{background:linear-gradient(90deg,rgba(255,240,160,.95),rgba(180,140,255,.85))}.efGamePanel{position:absolute;right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 46px);z-index:9;width:min(360px,calc(var(--ef-vw,100vw) - 24px));max-height:64vh;overflow:auto;padding:12px;border-radius:22px;background:rgba(2,16,27,.88);border:1px solid rgba(150,230,255,.18);box-shadow:0 22px 70px rgba(0,0,0,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-sizing:border-box}.efGamePanel.mapPanel{left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));width:auto;max-height:78vh}.efPanelHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.efPanelHead button,.efSettingRow button,.efZoomPresets button,.efWideButton{border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#e7f2ff;font-weight:950}.efPanelHead button{width:30px;height:30px;font-size:18px}.efMenuGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efMenuGrid button{min-height:46px;border-radius:16px;border:1px solid rgba(150,230,255,.15);background:rgba(255,255,255,.07);color:#e7f2ff;font-weight:1000}.efFullMapPanel{display:grid;gap:10px}.efWorldMapFrame{width:100%;border:1px solid rgba(150,230,255,.16);border-radius:18px;background:rgba(0,0,0,.18);overflow:hidden}.efWorldMapSvg{display:block;width:100%;height:min(58vh,430px)}.efMapLegend{display:flex;gap:10px;flex-wrap:wrap}.efMapLegend span{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:rgba(231,242,255,.76);font-weight:850}.efMapLegend b{width:10px;height:10px;border-radius:99px;display:inline-block}.efMapLegend b.player{background:#6effb4}.efMapLegend b.apex{background:#ffd86d}.efMapLegend b.hunter{background:#ffb45a}.efMapLegend b.event{background:#fff3a0}.efPanelItem,.efQuestItem{width:100%;display:grid;gap:4px;text-align:left;margin-top:8px;padding:10px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;box-sizing:border-box}.efPanelItem:disabled{opacity:.52}.efPanelItem b,.efQuestItem b{display:flex;justify-content:space-between;gap:10px;font-size:12px}.efPanelItem b span,.efQuestItem b span{color:rgba(120,240,255,.86)}.efPanelItem small,.efQuestItem small,.efSettingBlock small{color:rgba(231,242,255,.66);line-height:1.35;margin:0}.efPanelItem em,.efQuestItem em{font-style:normal;color:#fff3a0;font-size:11px;font-weight:950}.efQuestItem.done{border-color:rgba(110,255,180,.22);background:rgba(110,255,180,.06)}.efShopPanel,.efSettingsPanel{display:grid;gap:10px}.efSettingBlock{display:grid;gap:8px;padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.055)}.efControlModes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efControlModes.two{grid-template-columns:repeat(2,1fr)}.efControlModes button{min-height:36px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;font-weight:950}.efControlModes button.active,.efSettingRow button.active{border-color:rgba(120,240,255,.34);background:linear-gradient(180deg,rgba(120,240,255,.18),rgba(90,160,255,.08))}.efSettingRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.055)}.efZoomControl{display:grid;gap:7px;font-size:12px;color:rgba(231,242,255,.72)}.efZoomControl input{width:100%}.efZoomPresets{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efWideButton{min-height:38px}.efShopBalance{grid-template-columns:repeat(2,1fr)}.efShopBalance span{min-height:42px;font-size:13px}.efShopBalance em{font-style:normal;color:rgba(231,242,255,.62);font-size:9px}.efShopTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efShopTabs button{min-height:32px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#e7f2ff;font-size:11px;font-weight:950}.efShopTabs button.active{background:rgba(120,240,255,.16);border-color:rgba(120,240,255,.24)}.efShopGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efShopCard{display:grid;gap:4px;justify-items:center;text-align:center;padding:10px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055);color:#e7f2ff}.efShopCard.equipped{border-color:rgba(110,255,180,.32)}.efShopCard.coralPrice{border-color:rgba(190,140,255,.20)}.efShopCard small{font-size:10px;color:#fff3a0}.efShopCard em{font-style:normal;font-size:10px;color:rgba(120,240,255,.88);font-weight:1000}.efShopPanel a{min-height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(120,240,255,.12);border:1px solid rgba(120,240,255,.20);color:#e7f2ff;text-decoration:none;font-weight:950}.efQuickBar{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 18px);z-index:8;display:flex;gap:8px;padding:8px;border-radius:24px;background:rgba(2,16,27,.42);border:1px solid rgba(150,230,255,.11);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efQuickBar button,.efUnlockPill{min-width:72px;min-height:38px;display:inline-flex;align-items:center;justify-content:center;padding:0 13px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(150,230,255,.16);color:#e7f2ff;font-size:11px;font-weight:1000}.efQuickBar button.primary{background:rgba(120,240,255,.14);border-color:rgba(120,240,255,.26)}.efUnlockPill{position:absolute;left:max(16px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 18px);z-index:9;min-width:118px;min-height:30px;background:rgba(2,16,27,.44);border-color:rgba(255,220,120,.25);color:#fff3c6;font-size:10px}.efNextControls{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:5;display:flex;gap:12px}.efNextControls button{width:78px;height:78px;border-radius:999px;border:1px solid rgba(150,230,255,.22);background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.12));box-shadow:0 14px 38px rgba(0,0,0,.28);color:#e7f2ff;font-weight:1000;letter-spacing:.04em;touch-action:manipulation}.efNextControls button:first-child{background:linear-gradient(180deg,rgba(255,110,110,.24),rgba(255,90,90,.12))}.efNextControls button:disabled{opacity:.45}.efStickFloatZone{position:absolute;left:0;top:0;width:min(62vw,460px);height:var(--ef-vh,100dvh);z-index:2;touch-action:none}.efStickFloatZone span{position:absolute;left:max(16px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 116px);font-size:9px;font-weight:1000;color:rgba(120,240,255,.38);letter-spacing:.08em}.efMoveStick{position:absolute;left:max(16px,env(safe-area-inset-left));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 112px);z-index:10;border-radius:999px;background:radial-gradient(circle,rgba(120,240,255,.12),rgba(2,16,27,.30));border:1px solid rgba(150,230,255,.16);box-shadow:0 14px 38px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.08);touch-action:none;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.efMoveStick.floatStick{position:fixed;pointer-events:none}.efMoveStick span{position:absolute;left:50%;top:50%;border-radius:999px;background:linear-gradient(180deg,rgba(231,242,255,.78),rgba(120,240,255,.28));border:1px solid rgba(255,255,255,.28);box-shadow:0 10px 24px rgba(0,0,0,.20);transition:transform 45ms linear}.efMoveStick.active{border-color:rgba(120,240,255,.38)}.efMoveStick.lockedStick{opacity:.92}.efNextRevive{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;padding:18px 22px;border-radius:24px;background:rgba(2,16,27,.78);border:1px solid rgba(255,120,120,.22);box-shadow:0 22px 70px rgba(0,0,0,.34);font-size:18px;font-weight:1000;color:#ffd0d0;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.efTutorialCard{position:absolute;left:50%;top:calc(max(14px,env(safe-area-inset-top)) + 122px);transform:translateX(-50%);z-index:11;width:min(380px,calc(var(--ef-vw,100vw) - 24px));padding:12px;border-radius:20px;border:1px solid rgba(255,220,120,.22);background:rgba(2,16,27,.80);box-shadow:0 20px 60px rgba(0,0,0,.34);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:grid;gap:8px}.efTutorialCard b{color:#fff3a0}.efTutorialCard p{margin:0;color:rgba(231,242,255,.72);font-size:12px;line-height:1.4}.efTutorialCard div{display:flex;gap:6px;flex-wrap:wrap}.efTutorialCard button{min-height:32px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#e7f2ff;font-weight:1000;padding:0 11px}.efTutorialCard button.primary{background:rgba(120,240,255,.16);border-color:rgba(120,240,255,.28)}@media(max-width:760px){.efNextHud{width:min(264px,calc(var(--ef-vw,100vw) - 24px));max-height:31vh}.efNextHud.compact{width:min(224px,calc(var(--ef-vw,100vw) - 24px));max-height:102px}.efGamePanel{left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 42px);width:auto;max-height:62vh}.efNextControls button{width:70px;height:70px}.efShopGrid{grid-template-columns:1fr}.efTutorialCard{top:calc(max(12px,env(safe-area-inset-top)) + 104px)}}
      `}</style>
    </main>
  );
}
