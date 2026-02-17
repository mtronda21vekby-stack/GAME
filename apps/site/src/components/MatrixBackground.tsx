import React from "react";

export type MatrixBackgroundProps = {
  className?: string;
  style?: React.CSSProperties;
  /** 0.5..2 — плотность/скорость (по умолчанию 1) */
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
  const runningRef = React.useRef(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = !!mql?.matches;

    // Цвета "blue matrix"
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

    function randChar() {
      const i = (Math.random() * glyphs.length) | 0;
      return glyphs[i] || "0";
    }

    function drawStatic() {
      if (state.w <= 1 || state.h <= 1) return;
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

    function resizeTo(cssW: number, cssH: number) {
      const w = Math.max(1, Math.floor(cssW));
      const h = Math.max(1, Math.floor(cssH));

      // dpr режем до 2 — iOS меньше лагает
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      // если размер не изменился — ничего не делаем
      if (w === state.w && h === state.h && dpr === state.dpr) return;

      state.w = w;
      state.h = h;
      state.dpr = dpr;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const base = w >= 980 ? 18 : 16;
      state.fontSize = Math.max(14, Math.min(22, Math.floor(base * (0.95 + 0.18 * intensity))));

      ctx.font = `700 ${state.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "top";

      state.cols = Math.max(10, Math.floor(w / state.fontSize));
      state.drops = new Array(state.cols).fill(0).map(() => Math.random() * h);

      drawStatic();
    }

    function frame() {
      if (!runningRef.current) return;

      // если внезапно ушли в нулевой размер — стопаем
      if (state.w <= 1 || state.h <= 1) {
        rafRef.current = window.requestAnimationFrame(frame);
        return;
      }

      ctx.fillStyle = FADE;
      ctx.fillRect(0, 0, state.w, state.h);

      const step = Math.max(10, Math.floor(12 * intensity));
      const speed = 1.0 + 0.55 * intensity;

      for (let i = 0; i < state.cols; i++) {
        const x = i * state.fontSize;
        const y = state.drops[i];

        ctx.fillStyle = FG;
        ctx.fillText(randChar(), x, y);

        ctx.fillStyle = FG_DIM;
        ctx.fillText(randChar(), x, y + state.fontSize);

        state.drops[i] = y + step * speed;

        if (state.drops[i] > state.h + state.fontSize * 2) {
          if (Math.random() > 0.975) state.drops[i] = -Math.random() * 200;
        }
      }

      rafRef.current = window.requestAnimationFrame(frame);
    }

    function stop() {
      runningRef.current = false;
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function start() {
      if (reduced) {
        stop();
        drawStatic();
        return;
      }
      if (runningRef.current) return;
      runningRef.current = true;
      rafRef.current = window.requestAnimationFrame(frame);
    }

    const onMql = () => {
      reduced = !!mql?.matches;
      if (reduced) {
        stop();
        drawStatic();
      } else {
        start();
      }
    };
    mql?.addEventListener?.("change", onMql);

    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    // iOS/ Safari: иногда rAF “застывает” после сна — форсим рестарт
    const onPageShow = () => start();
    const onFocus = () => start();
    const onPointer = () => start();

    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pointerdown", onPointer, { passive: true });

    // ResizeObserver — главное: НЕ vv.scroll
    let ro: ResizeObserver | null = null;
    let roRaf = 0;

    const scheduleResize = (w: number, h: number) => {
      if (roRaf) return;
      roRaf = window.requestAnimationFrame(() => {
        roRaf = 0;
        resizeTo(w, h);
      });
    };

    ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const cr = e.contentRect;
      scheduleResize(cr.width, cr.height);
    });

    // наблюдаем за самим canvas (он растянут CSS-ом под родителя)
    ro.observe(canvas);

    // первичная инициализация
    const r = canvas.getBoundingClientRect();
    resizeTo(r.width, r.height);
    start();

    return () => {
      stop();
      if (roRaf) window.cancelAnimationFrame(roRaf);
      ro?.disconnect();
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pointerdown", onPointer as any);
      mql?.removeEventListener?.("change", onMql);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={["bcMatrixBg", className].filter(Boolean).join(" ")}
      style={{
        display: "block",
        width: "100%",
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
