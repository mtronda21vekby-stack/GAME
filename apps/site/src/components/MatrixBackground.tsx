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

export default function MatrixBackground({
  className,
  opacity = 0.10,
  speed = 0.42,
  density = 1.05,
  fontSize = 16,
  color = "rgba(90, 190, 255, 0.92)",
  glow = true,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const chars = useMemo(() => DEFAULT_CHARS.split(""), []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("bc-matrix-on");

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
      const rect = canvas.getBoundingClientRect();
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.max(1, Math.floor((w / fontSize) * density));
      drops = new Float32Array(columns);
      speeds = new Float32Array(columns);

      for (let i = 0; i < columns; i++) {
        drops[i] = rand(-h / fontSize, 0);
        speeds[i] = rand(0.45, 1.05) * speed;
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      firstPaint = true;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
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
      ctx.fillStyle = firstPaint || prefersReduced ? "#000" : "rgba(0,0,0,0.10)";
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

        if (y > h && Math.random() > 0.987) {
          drops[i] = rand(-28, 0);
          speeds[i] = rand(0.45, 1.05) * speed;
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      root.classList.remove("bc-matrix-on");
    };
  }, [chars, opacity, speed, density, fontSize, color, glow]);

  return <canvas ref={canvasRef} className={className ?? "bc-matrix-bg"} aria-hidden="true" />;
}
