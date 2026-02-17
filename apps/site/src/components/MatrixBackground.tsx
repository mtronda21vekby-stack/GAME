import React from "react";

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

export default function MatrixBackground() {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const rafRef = React.useRef<number | null>(null);
  const dropsRef = React.useRef<number[]>([]);
  const colsRef = React.useRef<number>(0);
  const lastTsRef = React.useRef<number>(0);

  const resize = React.useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // важно: реальный размер canvas = CSS размер * dpr
    const nextW = Math.round(w * dpr);
    const nextH = Math.round(h * dpr);

    if (canvas.width !== nextW) canvas.width = nextW;
    if (canvas.height !== nextH) canvas.height = nextH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontSize = 15;
    const cols = Math.max(1, Math.floor(w / fontSize));
    colsRef.current = cols;

    // инициализация “капель” под новый размер
    const drops = dropsRef.current;
    if (drops.length !== cols) {
      dropsRef.current = new Array(cols).fill(0).map(() => Math.random() * (h / fontSize));
    }
  }, []);

  React.useEffect(() => {
    resize();

    const wrap = wrapRef.current;
    if (!wrap) return;

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // iOS Safari: “прозрачность” ломается, когда visualViewport меняется при скролле
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, [resize]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 15;
    const baseSpeed = prefersReducedMotion() ? 30 : 60; // fps cap
    const frameMs = 1000 / baseSpeed;

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);

      const last = lastTsRef.current || ts;
      const dt = ts - last;
      if (dt < frameMs) return;
      lastTsRef.current = ts;

      const wrap = wrapRef.current;
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      // “шлейф”
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "top";

      const cols = colsRef.current || Math.max(1, Math.floor(w / fontSize));
      const drops = dropsRef.current.length ? dropsRef.current : new Array(cols).fill(0);

      for (let i = 0; i < cols; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];

        // синяя матрица + лёгкий свеч
        ctx.fillStyle = "rgba(80, 160, 255, 0.86)";
        ctx.fillText(ch, x, y);

        // “яркая голова” иногда
        if (Math.random() < 0.07) {
          ctx.fillStyle = "rgba(170, 220, 255, 0.92)";
          ctx.fillText(ch, x, y);
        }

        // падение
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.72;
      }

      dropsRef.current = drops;
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
