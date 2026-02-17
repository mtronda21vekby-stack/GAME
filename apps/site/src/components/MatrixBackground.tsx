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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // prefers-reduced-motion: reduce => статичный фон без анимации
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = !!mql?.matches;

    // Blue matrix colors
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
      ctx.clearRect(0, 0, state.w, state.h);

      // мягкая “дымка”
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

    function measureViewport() {
      // ВАЖНО: берём реальные размеры viewport без подписки на scroll
      const vv = window.visualViewport;
      const w = Math.floor(vv?.width ?? window.innerWidth);
      const h = Math.floor(vv?.height ?? window.innerHeight);
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function resizeNow() {
      const { w, h } = measureViewport();
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

      // если размер не изменился — ничего не делаем (чтобы не лагало)
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

    function stop() {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function frame() {
      // fade
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

    function start() {
      stop();
      rafRef.current = window.requestAnimationFrame(frame);
    }

    const onMql = () => {
      reduced = !!mql?.matches;
      resizeNow();
      if (reduced) stop();
      else start();
    };

    mql?.addEventListener?.("change", onMql);

    // Экономия батареи + iOS иногда “замораживает” анимацию
    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else if (!reduced) start();
    };

    // BFCache / возврат на вкладку
    const onPageShow = () => {
      resizeNow();
      if (!reduced) start();
    };

    // resize события (НЕ scroll!)
    const onResize = () => resizeNow();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onPageShow);

    // на iOS изменение панелей даёт именно resize у visualViewport
    const vv = window.visualViewport;
    vv?.addEventListener?.("resize", onResize);

    resizeNow();
    if (!reduced) start();

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
      vv?.removeEventListener?.("resize", onResize);
      mql?.removeEventListener?.("change", onMql);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={["bcMatrixBg", className].filter(Boolean).join(" ")}
      // ВАЖНО: не задаём height/width инлайном — только CSS рулит
      style={{
        display: "block",
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
