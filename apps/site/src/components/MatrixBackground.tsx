import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

type MatrixBackgroundProps = {
  opacity?: number;   // 0..1
  speed?: number;     // 0.2..2
  density?: number;   // 0.6..1.6
  fontSize?: number;  // px
  color?: string;     // CSS color
  glow?: boolean;
};

const DEFAULT_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノ" +
  "ハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ";

function isBadBgLayer(el: HTMLElement) {
  const cs = getComputedStyle(el);
  if (cs.position !== "fixed") return false;

  const z = Number.isFinite(parseInt(cs.zIndex, 10)) ? parseInt(cs.zIndex, 10) : 0;
  if (z > 19) return false; // выше UI не трогаем

  const hasBg =
    cs.backgroundImage !== "none" ||
    cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    cs.backdropFilter !== "none" ||
    (cs as any).webkitBackdropFilter !== "none" ||
    cs.filter !== "none";

  if (!hasBg) return false;

  const r = el.getBoundingClientRect();
  const coversViewport =
    r.width >= window.innerWidth - 2 &&
    r.height >= window.innerHeight - 2 &&
    (Math.abs(r.left) <= 2 && Math.abs(r.top) <= 2);

  return coversViewport;
}

export default function MatrixBackground({
  opacity = 0.09, // киношно
  speed = 0.38,   // медленно
  density = 1.0,
  fontSize = 16,
  color = "rgba(90, 190, 255, 0.92)", // premium blue
  glow = true,
}: MatrixBackgroundProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const disabledLayersRef = useRef<HTMLElement[]>([]);

  const chars = useMemo(() => DEFAULT_CHARS.split(""), []);

  useEffect(() => {
    document.documentElement.classList.add("bc-matrix-on");

    // 1) Создаём host в body (чтобы fixed не зависел от transform/layout в React)
    const host = document.createElement("div");
    host.setAttribute("data-bc-matrix-host", "1");
    document.body.appendChild(host);
    hostRef.current = host;

    // 2) Вырубаем старые fixed фоновые слои, которые перекрывают матрицу
    const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
    const disabled: HTMLElement[] = [];
    for (const el of all) {
      if (el === host) continue;
      if (isBadBgLayer(el)) {
        el.dataset.bcPrevDisplay = el.style.display || "";
        el.style.display = "none";
        disabled.push(el);
      }
    }
    disabledLayersRef.current = disabled;

    return () => {
      // restore layers
      for (const el of disabledLayersRef.current) {
        el.style.display = el.dataset.bcPrevDisplay ?? "";
        delete el.dataset.bcPrevDisplay;
      }
      disabledLayersRef.current = [];

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (hostRef.current && hostRef.current.parentNode) {
        hostRef.current.parentNode.removeChild(hostRef.current);
      }
      hostRef.current = null;

      document.documentElement.classList.remove("bc-matrix-on");
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let columns = 0;
    let drops = new Float32Array(0);
    let speeds = new Float32Array(0);
    let firstPaint = true;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.max(1, Math.floor(window.innerWidth));
      h = Math.max(1, Math.floor(window.innerHeight));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.max(1, Math.floor((w / fontSize) * density));
      drops = new Float32Array(columns);
      speeds = new Float32Array(columns);

      for (let i = 0; i < columns; i++) {
        drops[i] = rand(-h / fontSize, 0);
        speeds[i] = rand(0.42, 1.0) * speed;
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      firstPaint = true;
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    resize();

    let last = performance.now();

    const tick = (t: number) => {
      if (document.hidden) {
        last = t;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(40, t - last);
      last = t;

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = firstPaint || prefersReduced ? "#000" : "rgba(0,0,0,0.09)"; // длинный шлейф, кино
      ctx.fillRect(0, 0, w, h);
      firstPaint = false;

      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

      if (glow) {
        ctx.shadowColor = "rgba(70, 170, 255, 0.55)";
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowBlur = 0;
      }

      const step = dt / 16.6667;

      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = color;
        ctx.fillText(chars[(Math.random() * chars.length) | 0], x, y);

        drops[i] += speeds[i] * step;

        if (y > h && Math.random() > 0.988) {
          drops[i] = rand(-28, 0);
          speeds[i] = rand(0.42, 1.0) * speed;
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [chars, opacity, speed, density, fontSize, color, glow]);

  if (!hostRef.current) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="bc-matrix-bg"
      aria-hidden="true"
    />,
    hostRef.current
  );
}
