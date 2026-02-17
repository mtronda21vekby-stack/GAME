import React, { useEffect, useMemo, useRef } from "react";

type MatrixBackgroundProps = {
  className?: string;
  opacity?: number;
  speed?: number;
  density?: number;
  fontSize?: number;
  color?: string;
  glow?: boolean;
};

const DEFAULT_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノ" +
  "ハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ";

function isFullScreenFixedBackground(el: HTMLElement) {
  const cs = getComputedStyle(el);
  if (cs.position !== "fixed") return false;

  const z = Number.isFinite(parseInt(cs.zIndex, 10)) ? parseInt(cs.zIndex, 10) : 0;
  if (z >= 50) return false; // UI/модалки/оверлеи не трогаем

  const hasBg =
    cs.backgroundImage !== "none" ||
    cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    cs.filter !== "none" ||
    cs.backdropFilter !== "none" ||
    (cs as any).webkitBackdropFilter !== "none";

  if (!hasBg) return false;

  const r = el.getBoundingClientRect();
  const covers =
    r.width >= window.innerWidth - 2 &&
    r.height >= window.innerHeight - 2 &&
    Math.abs(r.left) <= 2 &&
    Math.abs(r.top) <= 2;

  return covers;
}

export default function MatrixBackground({
  className,
  opacity = 0.085,                 // киношно
  speed = 0.36,                    // медленнее
  density = 1.0,
  fontSize = 16,
  color = "rgba(90, 190, 255, 0.92)", // premium blue
  glow = true,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const disabledRef = useRef<Array<{ el: HTMLElement; prev: string }>>([]);

  const chars = useMemo(() => DEFAULT_CHARS.split(""), []);

  useEffect(() => {
    document.documentElement.classList.add("bc-matrix-on");

    // Убиваем старые fullscreen fixed фон-слои, которые перекрывают матрицу
    const nodes = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
    const disabled: Array<{ el: HTMLElement; prev: string }> = [];

    for (const el of nodes) {
      if (el.tagName === "CANVAS") continue;
      if (!isFullScreenFixedBackground(el)) continue;

      const prev = el.style.display || "";
      el.style.display = "none";
      disabled.push({ el, prev });
    }

    disabledRef.current = disabled;

    return () => {
      for (const it of disabledRef.current) it.el.style.display = it.prev;
      disabledRef.current = [];
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
      // Берём реальный viewport (на мобиле это важно)
      const vw = Math.max(1, Math.floor(window.innerWidth));
      const vh = Math.max(1, Math.floor(window.innerHeight));

      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = vw;
      h = vh;

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
      const dt = Math.min(40, t - last);
      last = t;

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = firstPaint || prefersReduced ? "#000" : "rgba(0,0,0,0.09)";
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [chars, opacity, speed, density, fontSize, color, glow]);

  return <canvas ref={canvasRef} className={className ?? "bc-matrix-bg"} aria-hidden="true" />;
}
