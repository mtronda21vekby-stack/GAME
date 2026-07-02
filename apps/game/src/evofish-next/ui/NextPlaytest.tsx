import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../../router";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import { EVOFISH_FORMS } from "../content/forms";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { drawEvoFishSkin } from "../render/canvasSkinRenderer";
import { loadEvoFishNextSave } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

type FishEntity = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  form: EvoFishFormId;
  skin: EvoFishSkinDefinition;
  angle: number;
};

type RuntimeStats = {
  mass: number;
  kills: number;
  skinName: string;
  formName: string;
};

const WORLD = { width: 2800, height: 1800 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeEnemy(id: number): FishEntity {
  const big = id % 7 === 0;
  const skin = big ? EVOFISH_SKIN_BY_ID.shark_classic : EVOFISH_SKIN_BY_ID.premium_fish;
  return {
    id,
    x: 180 + Math.random() * (WORLD.width - 360),
    y: 180 + Math.random() * (WORLD.height - 360),
    vx: -50 + Math.random() * 100,
    vy: -50 + Math.random() * 100,
    radius: big ? 22 : 14 + Math.random() * 8,
    mass: big ? 2.4 : 0.45 + Math.random() * 0.7,
    form: big ? "shark" : "fish",
    skin,
    angle: 0
  };
}

function drawWorld(ctx: CanvasRenderingContext2D, camX: number, camY: number, width: number, height: number) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "#06304a");
  g.addColorStop(1, "#020b15");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(-camX, -camY);
  ctx.strokeStyle = "rgba(150,230,255,.055)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.height);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD.height; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(150,230,255,.16)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();
}

function formFromSkin(skin: EvoFishSkinDefinition): EvoFishFormId {
  return skin.form === "any" ? "fish" : skin.form;
}

function radiusFromForm(form: EvoFishFormId) {
  if (form === "fish") return 24;
  if (form === "shark") return 31;
  return 39;
}

function massFromForm(form: EvoFishFormId) {
  if (form === "fish") return 1.2;
  if (form === "shark") return 3.2;
  return 6.5;
}

export function NextPlaytest() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stats, setStats] = useState<RuntimeStats>({ mass: 1, kills: 0, skinName: "—", formName: "—" });

  const save = useMemo(() => loadEvoFishNextSave(), []);
  const skin = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;
  const form = formFromSkin(skin);
  const formDef = EVOFISH_FORMS[form];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let last = performance.now();
    let live = true;
    let kills = 0;
    const input = { x: 0, y: 0, down: false };
    const player = {
      x: WORLD.width / 2,
      y: WORLD.height / 2,
      vx: 0,
      vy: 0,
      radius: radiusFromForm(form),
      mass: massFromForm(form),
      angle: 0
    };
    const enemies: FishEntity[] = Array.from({ length: 34 }, (_, i) => makeEnemy(i + 1));

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      input.x = event.clientX - rect.left;
      input.y = event.clientY - rect.top;
    };

    const onDown = (event: PointerEvent) => {
      input.down = true;
      pointer(event);
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => pointer(event);
    const onUp = () => { input.down = false; };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const loop = (now: number) => {
      if (!live) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      const cw = canvas.clientWidth || 1;
      const ch = canvas.clientHeight || 1;
      const camX = clamp(player.x - cw / 2, 0, WORLD.width - cw);
      const camY = clamp(player.y - ch / 2, 0, WORLD.height - ch);

      if (input.down) {
        const tx = camX + input.x;
        const ty = camY + input.y;
        const dx = tx - player.x;
        const dy = ty - player.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = form === "fish" ? 430 : form === "shark" ? 385 : 330;
        player.vx += (dx / len) * speed * dt * 3.2;
        player.vy += (dy / len) * speed * dt * 3.2;
        player.angle = Math.atan2(dy, dx);
      }

      player.vx *= 0.9;
      player.vy *= 0.9;
      player.x = clamp(player.x + player.vx * dt, 40, WORLD.width - 40);
      player.y = clamp(player.y + player.vy * dt, 40, WORLD.height - 40);

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < 80 || e.x > WORLD.width - 80) e.vx *= -1;
        if (e.y < 80 || e.y > WORLD.height - 80) e.vy *= -1;
        e.angle = Math.atan2(e.vy, e.vx);

        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < player.radius + e.radius && player.mass >= e.mass * 1.08) {
          player.mass += e.mass * 0.08;
          player.radius = Math.min(player.radius + e.radius * 0.018, 58);
          kills += 1;
          enemies.splice(i, 1, makeEnemy(1000 + kills));
        }
      }

      drawWorld(ctx, camX, camY, cw, ch);
      ctx.save();
      ctx.translate(-camX, -camY);
      for (const e of enemies) {
        const danger = player.mass < e.mass * 1.08;
        ctx.strokeStyle = danger ? "rgba(255,90,90,.32)" : "rgba(110,255,180,.24)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 1.85, 0, Math.PI * 2);
        ctx.stroke();
        drawEvoFishSkin(ctx, e.skin, e.form, { x: e.x, y: e.y, radius: e.radius, angle: e.angle, alpha: danger ? 0.92 : 0.82 });
      }
      drawEvoFishSkin(ctx, skin, form, { x: player.x, y: player.y, radius: player.radius, angle: player.angle, alpha: 1 });
      ctx.restore();

      frame += 1;
      if (frame % 10 === 0) {
        setStats({ mass: player.mass, kills, skinName: skin.name, formName: formDef.name });
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      live = false;
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [form, formDef.name, skin]);

  return (
    <main className="efNextPlay">
      <canvas ref={canvasRef} className="efNextCanvas" />
      <div className="efNextHud">
        <b>EvoFish Next</b>
        <span>{EVOFISH_NEXT_VERSION}</span>
        <span>{stats.formName} · {stats.skinName}</span>
        <span>Mass {stats.mass.toFixed(2)} · Kills {stats.kills}</span>
      </div>
      <div className="efNextHelp">Тап/удержание — движение к пальцу. Зелёный круг — можно съесть. Красный — опасно.</div>
      <div className="efNextLinks">
        <Link to="/game/next/skins">Skin Lab</Link>
        <Link to="/game">Playable EvoFish</Link>
      </div>
      <style>{`
        .efNextPlay{position:fixed;inset:0;overflow:hidden;background:#031827;color:#e7f2ff;touch-action:none}.efNextCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}.efNextHud{position:absolute;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));z-index:3;display:grid;gap:3px;padding:12px 14px;border-radius:20px;background:rgba(2,16,27,.62);border:1px solid rgba(150,230,255,.15);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 14px 40px rgba(0,0,0,.26)}.efNextHud b{font-size:13px}.efNextHud span{font-size:11px;color:rgba(231,242,255,.76)}.efNextHelp{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3;max-width:min(620px,calc(100vw - 24px));padding:10px 13px;border-radius:999px;background:rgba(2,16,27,.48);border:1px solid rgba(150,230,255,.12);font-size:12px;text-align:center;color:rgba(231,242,255,.76);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efNextLinks{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:4;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efNextLinks a{min-height:34px;display:inline-flex;align-items:center;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(150,230,255,.14);color:#e7f2ff;text-decoration:none;font-size:12px;font-weight:900}@media(max-width:760px){.efNextLinks{top:auto;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 48px)}.efNextHelp{font-size:11px}.efNextHud{max-width:180px}}
      `}</style>
    </main>
  );
}
