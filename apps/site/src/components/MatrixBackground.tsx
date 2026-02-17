import React, { useEffect, useMemo, useRef } from "react";

type MatrixBackgroundProps = {
  className?: string;
  opacity?: number;   // 0..1
  speed?: number;     // 0.25..3
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

export default function MatrixBackground({
  className,
  opacity = 0.14,
  speed = 0.55,          // в 2 раза медленнее по умолчанию
  density = 1.0,
  fontSize = 16,
  color = "rgba(0, 255, 170, 0.95)",
  glow = true,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const chars = useMemo(() => DEFAULT_CHARS.split(""), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;

    let columns = 0;
    let drops: Float32Array = new Float32Array(0);
    let speeds: Float32Array = new Float32Array(0);
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
        speeds[i] = rand(0.55, 1.35) * speed;
      }

      // Жёстко заливаем чёрным, чтобы ничего снизу не светилось
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

      // ФОН: всегда чёрный. Первый кадр — полностью, дальше — “шлейф”.
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = firstPaint || prefersReduced ? "#000" : "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);
      firstPaint = false;

      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

      if (glow) {
        ctx.shadowColor = "rgba(0, 255, 170, 0.50)";
        ctx.shadowBlur = 10;
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

        if (y > h && Math.random() > 0.985) {
          drops[i] = rand(-24, 0);
          speeds[i] = rand(0.55, 1.35) * speed;
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [chars, opacity, speed, density, fontSize, color, glow]);

  return <canvas ref={canvasRef} className={className ?? "bc-matrix-bg"} aria-hidden="true" />;
}
