import React from "react";

export type MatrixBackgroundProps = {
  className?: string;
  style?: React.CSSProperties;
  intensity?: number; // 0.5..2
};

export function MatrixBackground(props: MatrixBackgroundProps) {
  const { className, style, intensity = 1 } = props;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const host = (canvas.parentElement as HTMLElement | null) ?? document.body;

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

    function stop() {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function randChar() {
      const i = (Math.random() * glyphs.length) | 0;
      return glyphs[i] || "0";
    }

    function drawStatic() {
      if (state.w <= 0 || state.h <= 0) return;

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

    function frame() {
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

    function resize() {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));

      // не дергаем, если реально ничего не изменилось
      if (w === state.w && h === state.h) return;

      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

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

    const onMql = () => {
      reduced = !!mql?.matches;
      resize();
      if (reduced) stop();
      else start();
    };

    mql?.addEventListener?.("change", onMql);

    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else if (!reduced) start();
    };

    window.addEventListener("visibilitychange", onVis);

    // Ключ: следим за реальным слоем через ResizeObserver (это фиксит iOS/desktop без дерганий)
    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    // Fallback на системные события
    const onWinResize = () => resize();
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);

    // первичный размер
    resize();
    if (!reduced) start();

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
      window.removeEventListener("visibilitychange", onVis);
      mql?.removeEventListener?.("change", onMql);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={["bcMatrixBg", className].filter(Boolean).join(" ")}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export default MatrixBackground;
