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
      // ВАЖНО: берем реальный размер элемента (CSS задаёт overscan/inset)
      return canvas.getBoundingClientRect();
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

    function resizeNow() {
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

      ctx.clearRect(0, 0, state.w, state.h);
      drawStatic();
    }

    // --- THROTTLE resize events (iOS visualViewport scroll может стрелять очень часто)
    let resizeRaf: number | null = null;
    function scheduleResize() {
      if (resizeRaf != null) return;
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = null;
        resizeNow();
      });
    }

    function stop() {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
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

    function start() {
      stop();
      rafRef.current = window.requestAnimationFrame(frame);
    }

    const onMql = () => {
      reduced = !!mql?.matches;
      scheduleResize();
      if (reduced) stop();
      else start();
    };

    mql?.addEventListener?.("change", onMql);

    // visibility + BFCache (иногда iOS “забывает” оживить RAF)
    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else if (!reduced) start();
    };

    const onPageShow = () => {
      scheduleResize();
      if (!reduced) start();
    };

    window.addEventListener("resize", scheduleResize);
    window.addEventListener("orientationchange", scheduleResize);
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onPageShow);

    // visualViewport — must-have на iOS
    const vv = window.visualViewport;
    vv?.addEventListener?.("resize", scheduleResize);
    vv?.addEventListener?.("scroll", scheduleResize);

    // init
    resizeNow();
    if (!reduced) start();

    return () => {
      stop();
      if (resizeRaf != null) window.cancelAnimationFrame(resizeRaf);

      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);

      vv?.removeEventListener?.("resize", scheduleResize);
      vv?.removeEventListener?.("scroll", scheduleResize);

      mql?.removeEventListener?.("change", onMql);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={["bcMatrixBg", className].filter(Boolean).join(" ")}
      // ВАЖНО: НЕ задаём height/width инлайном — иначе убиваем 100dvh/100lvh в CSS.
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
