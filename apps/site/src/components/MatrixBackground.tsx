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
  opacity = 0.075,                // кино: менее ярко
  speed = 0.26,                   // кино: медленнее
  density = 1.38,                 // плотнее
  fontSize = 15,                  // чуть мельче → плотнее визуально
  color = "rgba(90, 190, 255, 0.92)",
  glow = true,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const chars = useMemo(() => DEFAULT_CHARS.split(""), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // alpha:true + прозрачный фон (чёрный задаём базой страницы в CSS)
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
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
        speeds[i] = rand(0.40, 0.92) * speed;
      }

      // Сразу “прогреваем” — чтобы не было ощущения пустого экрана при старте
      ctx.clearRect(0, 0, w, h);
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

      // Прозрачный “fade” (чёрный уже в body). Это убирает “чёрную плашку”.
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (firstPaint || prefersReduced) {
        ctx.clearRect(0, 0, w, h);
      } else {
        // Киношный длинный шлейф: рисуем прозрачный чёрный на canvas
        // (чтобы символы не копились бесконечно)
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, 0, w, h);
      }

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

        if (y > h && Math.random() > 0.990) {
          drops[i] = rand(-34, 0);
          speeds[i] = rand(0.40, 0.92) * speed;
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

  return <canvas ref={canvasRef} className={className ?? "bc-matrix-bg"} aria-hidden="true" />;
}
