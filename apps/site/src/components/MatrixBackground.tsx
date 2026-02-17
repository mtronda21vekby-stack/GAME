import React from "react";

const SYMBOLS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "0123456789" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function pickSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? "0";
}

export function MatrixBackground() {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    // performance: чуть крупнее — меньше колонок
    let fontSize = 16;
    let cols = 0;
    let drops: number[] = [];

    let lastTs = 0;
    let acc = 0;

    function isReduceMotion() {
      // учитываем системный reduce-motion
      return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    }

    function resize() {
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2); // cap для стабильности
      dpr = nextDpr;

      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // на широких экранах чуть крупнее, чтобы не было "каши"
      fontSize = w >= 980 ? 18 : 16;
      cols = Math.ceil(w / fontSize);

      // стартовые позиции капель
      drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * (h / fontSize)));
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "top";
    }

    function clearFrame(alpha: number) {
      // "хвост": полупрозрачная заливка
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    function drawStatic() {
      clearFrame(1);
      // лёгкая сетка символов (статично), если reduce-motion
      const stepY = fontSize * 1.3;
      const stepX = fontSize * 1.0;
      for (let y = 0; y < h; y += stepY) {
        for (let x = 0; x < w; x += stepX) {
          const a = 0.10 + Math.random() * 0.08;
          ctx.fillStyle = `rgba(90,160,255,${a})`;
          ctx.fillText(pickSymbol(), x, y);
        }
      }
    }

    function tick(ts: number) {
      raf = requestAnimationFrame(tick);

      if (!lastTs) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      // throttle: целимся в ~30fps, но выглядит плавно и не жрёт
      acc += dt;
      if (acc < 33) return;
      acc = 0;

      if (document.hidden) return;

      // reduce-motion => статичная подложка
      if (isReduceMotion()) {
        drawStatic();
        return;
      }

      // чем меньше alpha — тем длиннее хвост
      clearFrame(0.08);

      for (let i = 0; i < cols; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // основной цвет
        ctx.fillStyle = "rgba(90,160,255,0.78)";
        ctx.fillText(pickSymbol(), x, y);

        // "голова" чуть ярче иногда
        if (Math.random() < 0.06) {
          ctx.fillStyle = "rgba(170,225,255,0.92)";
          ctx.fillText(pickSymbol(), x, Math.max(0, y - fontSize));
        }

        // вниз, иногда сброс
        drops[i] += 1;
        if (y > h && Math.random() > 0.975) drops[i] = 0;
      }
    }

    resize();
    // первый кадр — чтобы не мигало
    clearFrame(1);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    // важно: canvas по кликам не мешает, но пусть будет пауза при hidden
    const onVis = () => {
      if (document.hidden) {
        clearFrame(1);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="bcMatrixBg" aria-hidden="true" />;
}

export default MatrixBackground;
