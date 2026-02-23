import React from "react";

export type MatrixBackgroundProps = {
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
};

/**
 * Named export — чтобы работал:
 *   import { MatrixBackground } from "../components/MatrixBackground";
 */
export function MatrixBackground(props: MatrixBackgroundProps) {
  const { className, style, intensity = 1 } = props;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastFrameTsRef = React.useRef<number>(0);
  const lastDrawTsRef = React.useRef<number>(0);
  const watchdogRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // prefers-reduced-motion: reduce => без анимации
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = !!mql?.matches;

    const FG = "rgba(90, 180, 255, 0.92)";
    const FG_DIM = "rgba(90, 180, 255, 0.55)";
    const FADE = "rgba(0, 0, 0, 0.12)";

    const glyphs =
      "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+<>";

    const state = {
      w: 0,
      h: 0,
      dpr: 1,
      fontSize: 16,
      cols: 0,
      drops: [] as number[],
    };

    // Медленнее и легче: ~24 FPS
    const FRAME_MS = 1000 / 24;

    // Общий замедлитель скорости падения (ещё медленнее)
    const SLOW = 0.45;

    function getRect() {
      return canvas.getBoundingClientRect();
    }

    function randChar() {
      const i = (Math.random() * glyphs.length) | 0;
      return glyphs[i] || "0";
    }

    function drawStatic() {
      ctx.clearRect(0, 0, state.w, state.h);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, state.w, state.h);

      const count = Math.max(120, Math.floor((state.w * state.h) / 2200));
      for (let i = 0; i < count; i++) {
        const x = Math.random() * state.w;
        const y = Math.random() * state.h;
        ctx.fillStyle = Math.random() > 0.82 ? FG : FG_DIM;
        ctx.fillText(randChar(), x, y);
      }
    }

    function resize() {
      const r = getRect();

      // iPhone 3x DPR тяжёлый — ограничим до 2
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      state.w = Math.max(1, Math.floor(r.width));
      state.h = Math.max(1, Math.floor(r.height));
      state.dpr = dpr;

      canvas.width = Math.floor(state.w * dpr);
      canvas.height = Math.floor(state.h * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // КРУПНЕЕ СИМВОЛЫ:
      // - поднял базу
      // - поднял min/max
      // - интенсивность слегка влияет, но не раздувает всё в кашу
      const base = state.w >= 980 ? 22 : 20;
      state.fontSize = Math.max(18, Math.min(30, Math.floor(base * (0.98 + 0.16 * intensity))));

      ctx.font = `700 ${state.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "top";
      ctx.imageSmoothingEnabled = false;

      state.cols = Math.max(8, Math.floor(state.w / state.fontSize));
      state.drops = new Array(state.cols).fill(0).map(() => Math.random() * state.h);

      ctx.clearRect(0, 0, state.w, state.h);
      drawStatic();

      const now = performance.now();
      lastDrawTsRef.current = now;
      lastFrameTsRef.current = now;
    }

    function stop() {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function frame(ts: number) {
      lastFrameTsRef.current = ts;

      // throttling: рисуем не чаще ~24fps
      const lastDraw = lastDrawTsRef.current || 0;
      if (lastDraw > 0 && ts - lastDraw < FRAME_MS) {
        rafRef.current = window.requestAnimationFrame(frame);
        return;
      }

      const dt = lastDraw > 0 ? ts - lastDraw : FRAME_MS;
      lastDrawTsRef.current = ts;

      // clamp dt multiplier
      const dtMul = Math.max(0.5, Math.min(2.2, dt / 16.6667));

      ctx.fillStyle = FADE;
      ctx.fillRect(0, 0, state.w, state.h);

      // База шага/скорости
      const step = Math.max(10, Math.floor(12 * intensity));
      const speed = 1.0 + 0.55 * intensity;

      for (let i = 0; i < state.cols; i++) {
        const x = i * state.fontSize;
        const y = state.drops[i];

        ctx.fillStyle = FG;
        ctx.fillText(randChar(), x, y);

        ctx.fillStyle = FG_DIM;
        ctx.fillText(randChar(), x, y + state.fontSize);

        // Движение: dt + замедление
        state.drops[i] = y + step * speed * dtMul * SLOW;

        if (state.drops[i] > state.h + state.fontSize * 2) {
          if (Math.random() > 0.975) state.drops[i] = -Math.random() * 220;
        }
      }

      rafRef.current = window.requestAnimationFrame(frame);
    }

    function start() {
      stop();
      const now = performance.now();
      lastDrawTsRef.current = now;
      lastFrameTsRef.current = now;
      rafRef.current = window.requestAnimationFrame(frame);
    }

    const onMql = () => {
      reduced = !!mql?.matches;
      drawStatic();
      if (reduced) stop();
      else start();
    };
    mql?.addEventListener?.("change", onMql);

    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else if (!reduced) start();
    };

    const onResize = () => resize();

    // НЕ слушаем visualViewport.scroll
    const vv = window.visualViewport;

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("visibilitychange", onVis);
    vv?.addEventListener?.("resize", onResize);

    // Watchdog: если iOS “подвесил” rAF — мягко перезапускаем
    watchdogRef.current = window.setInterval(() => {
      if (reduced) return;
      if (document.visibilityState !== "visible") return;

      const now = performance.now();
      const last = lastFrameTsRef.current || 0;

      if (rafRef.current == null || (last > 0 && now - last > 1500)) {
        start();
      }
    }, 1200) as unknown as number;

    resize();
    if (!reduced) start();

    return () => {
      stop();

      if (watchdogRef.current != null) {
        window.clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }

      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("visibilitychange", onVis);

      vv?.removeEventListener?.("resize", onResize);
      mql?.removeEventListener?.("change", onMql);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={["bcMatrixBg", className].filter(Boolean).join(" ")}
      style={{
        display: "block",
        width: "100vw",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Default export — чтобы работал:
 *   import MatrixBackground from "./components/MatrixBackground";
 */
export default MatrixBackground;
