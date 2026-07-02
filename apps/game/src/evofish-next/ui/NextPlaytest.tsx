import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../../router";
import type { NextEngineStats, NextInputState } from "../core/engineTypes";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { renderNextWorld } from "../render/worldRenderer";
import { createNextWorld } from "../systems/createWorld";
import { stepNextEngine } from "../systems/engineStep";
import { loadEvoFishNextSave, saveEvoFishNextProgress } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

export function NextPlaytest() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<NextInputState>({ pointerX: 0, pointerY: 0, down: false, bite: false, dash: false });
  const [stats, setStats] = useState<NextEngineStats>({
    mass: 1,
    kills: 0,
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
    completedQuests: 0,
    activeQuestTitle: "—",
    activeQuestProgress: 0,
    activeQuestTarget: 1,
    skinName: "—",
    formName: "—",
    lastEvent: "Готов"
  });

  const save = useMemo(() => loadEvoFishNextSave(), []);
  const skin = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let live = true;
    let last = performance.now();
    let saveTimer = 0;
    const input = inputRef.current;
    const engine = createNextWorld(skin, save.progress, save.economy, save.quests);

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
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [skin, save.progress, save.economy, save.quests]);

  const hpPct = Math.max(0, Math.min(1, stats.hp / Math.max(1, stats.hpMax)));
  const xpPct = Math.max(0, Math.min(1, stats.xp / Math.max(1, stats.xpToNext)));
  const levelPct = Math.max(0, Math.min(1, stats.levelXp / Math.max(1, stats.levelXpToNext)));
  const questPct = Math.max(0, Math.min(1, stats.activeQuestProgress / Math.max(1, stats.activeQuestTarget)));

  return (
    <main className="efNextPlay">
      <canvas ref={canvasRef} className="efNextCanvas" />
      <div className="efNextHud">
        <b>EvoFish Next</b>
        <span>{EVOFISH_NEXT_VERSION}</span>
        <span>LV {stats.level} · Tier {stats.tier} · {stats.formName}</span>
        <span>{stats.skinName}</span>
        <span>Mass {stats.mass.toFixed(2)} · Kills {stats.kills}</span>
        <span>Жемчуг {stats.pearls} · Кораллы {stats.corals}</span>
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
      <div className="efNextHelp">Quest цели дают XP, жемчуг и кораллы. Прогресс сохраняется каждые 2 секунды.</div>
      <div className="efNextControls">
        <button onPointerDown={(event) => { event.preventDefault(); inputRef.current.bite = true; }}>BITE</button>
        <button onPointerDown={(event) => { event.preventDefault(); inputRef.current.dash = true; }}>DASH</button>
      </div>
      <div className="efNextLinks">
        <Link to="/game/next/skins">Skin Lab</Link>
        <Link to="/game">Playable EvoFish</Link>
      </div>
      <style>{`
        .efNextPlay{position:fixed;inset:0;overflow:hidden;background:#031827;color:#e7f2ff;touch-action:none}.efNextCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}.efNextHud{position:absolute;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));z-index:3;display:grid;gap:3px;padding:12px 14px;border-radius:20px;background:rgba(2,16,27,.62);border:1px solid rgba(150,230,255,.15);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 14px 40px rgba(0,0,0,.26)}.efNextHud b{font-size:13px}.efNextHud span{font-size:11px;color:rgba(231,242,255,.76)}.efNextHud i{display:block;width:166px;height:5px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efNextHud em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(110,255,180,.95),rgba(120,240,255,.85))}.efNextHud em.xp{background:linear-gradient(90deg,rgba(255,220,120,.95),rgba(255,160,90,.85))}.efNextHud em.level{background:linear-gradient(90deg,rgba(180,140,255,.95),rgba(120,240,255,.85))}.efNextHud em.quest{background:linear-gradient(90deg,rgba(255,240,160,.95),rgba(180,140,255,.85))}.efNextHelp{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3;max-width:min(640px,calc(100vw - 24px));padding:10px 13px;border-radius:999px;background:rgba(2,16,27,.48);border:1px solid rgba(150,230,255,.12);font-size:12px;text-align:center;color:rgba(231,242,255,.76);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efNextLinks{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:4;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efNextLinks a{min-height:34px;display:inline-flex;align-items:center;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(150,230,255,.14);color:#e7f2ff;text-decoration:none;font-size:12px;font-weight:900}.efNextControls{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:5;display:flex;gap:10px}.efNextControls button{width:78px;height:78px;border-radius:999px;border:1px solid rgba(150,230,255,.22);background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.12));box-shadow:0 14px 38px rgba(0,0,0,.28);color:#e7f2ff;font-weight:1000;letter-spacing:.04em;touch-action:manipulation}.efNextControls button:first-child{background:linear-gradient(180deg,rgba(255,110,110,.24),rgba(255,90,90,.12))}@media(max-width:760px){.efNextLinks{top:auto;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 92px)}.efNextHelp{left:max(12px,env(safe-area-inset-left));right:max(112px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));transform:none;text-align:left;font-size:11px}.efNextHud{max-width:214px}.efNextControls button{width:74px;height:74px}}
      `}</style>
    </main>
  );
}
