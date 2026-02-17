import React from "react";

export type MatrixBackgroundProps = {
  /** если хочешь переопределить стиль/класс — необязательно */
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

    // prefers-reduced-motion: reduce => делаем статичный фон без анимации
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = !!mql?.matches;

    const onMql = () => {
      reduced = !!mql?.matches;
      // перерисуем сразу
      drawStatic();
      if (reduced) stop();
      else start();
    };

    mql?.addEventListener?.("change", onMql);

    // Цвета "blue matrix"
    const FG = "rgba(90, 180, 255, 0.92)";
    const FG_DIM = "rgba(90, 180, 255, 0.55)";
    const FADE = "rgba(0, 0, 0, 0.12)";

    // Набор символов (читаемо и “богато”)
    const glyphs =
      "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+<>";

    const state = {
      w: 0,
      h: 0,
      dpr: 1,
      fontSize: 16,
      cols: 0,
      drops: [] as number[],
      tick: 0,
    };

    function getRect() {
      // ВАЖНО: берем реальный размер элемента (CSS уже делает 100lvh/100dvh)
      return canvas.getBoundingClientRect();
    }

    function resize() {
      const r = getRect();
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

      state.w = Math.max(1, Math.floor(r.width));
      state.h = Math.max(1, Math.floor(r.height));
      state.dpr = dpr;

      canvas.width = Math.floor(state.w * dpr);
      canvas.height = Math.floor(state.h * dpr);

      // рисуем в CSS-пикселях
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // динамический fontSize: чуть крупнее на больших экранах
      const base = state.w >= 980 ? 18 : 16;
      state.fontSize = Math.max(14, Math.min(22, Math.floor(base * (0.95 + 0.18 * intensity))));

      ctx.font = `700 ${state.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "top";

      state.cols = Math.max(10, Math.floor(state.w / state.fontSize));
      state.drops = new Array(state.cols).fill(0).map(() => Math.random() * state.h);

      // чистый стартовый кадр
      ctx.clearRect(0, 0, state.w, state.h);
      drawStatic();
    }

    function randChar() {
      const i = (Math.random() * glyphs.length) | 0;
      return glyphs[i] || "0";
    }

    function drawStatic() {
      ctx.clearRect(0, 0, state.w, state.h);

      // лёгкая дымка под символами (чтоб было “премиум”, но без грязи)
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

    function frame() {
      // fade слой
      ctx.fillStyle = FADE;
      ctx.fillRect(0, 0, state.w, state.h);

      const step = Math.max(10, Math.floor(12 * intensity));
      const speed = 1.0 + 0.55 * intensity;

      for (let i = 0; i < state.cols; i++) {
        const x = i * state.fontSize;
        const y = state.drops[i];

        // яркий “головной” символ
        ctx.fillStyle = FG;
        ctx.fillText(randChar(), x, y);

        // следующий бледнее
        ctx.fillStyle = FG_DIM;
        ctx.fillText(randChar(), x, y + state.fontSize);

        state.drops[i] = y + step * speed;

        // сброс вниз с рандомом
        if (state.drops[i] > state.h + state.fontSize * 2) {
          if (Math.random() > 0.975) state.drops[i] = -Math.random() * 200;
        }
      }

      state.tick++;
      rafRef.current = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function start() {
      stop();
      rafRef.current = window.requestAnimationFrame(frame);
    }

    // visibility: экономим батарейку + не дёргаем iOS
    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else if (!reduced) start();
    };

    // resize + iOS visualViewport изменения (самая частая причина “полос”)
    const onResize = () => resize();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("visibilitychange", onVis);

    // visualViewport — must-have на iOS
    const vv = window.visualViewport;
    vv?.addEventListener?.("resize", onResize);
    vv?.addEventListener?.("scroll", onResize);

    resize();
    if (!reduced) start();

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("visibilitychange", onVis);
      vv?.removeEventListener?.("resize", onResize);
      vv?.removeEventListener?.("scroll", onResize);
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
