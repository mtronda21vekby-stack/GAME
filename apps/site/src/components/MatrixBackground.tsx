import React from "react";

export type MatrixBackgroundProps = {
  className?: string;
  style?: React.CSSProperties;
  /** 0.5..2 — плотность/скорость (по умолчанию 1) */
  intensity?: number;
};

export function MatrixBackground(props: MatrixBackgroundProps) {
  const { className, style, intensity = 1 } = props;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const rafRef = React.useRef<number | null>(null);
  const runningRef = React.useRef(false);
  const lastFrameAtRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const host = (canvas.parentElement as HTMLElement | null) ?? document.body;

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

    function stop() {
      runningRef.current = false;
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function drawStatic() {
      if (state.w <= 0 || state.h <= 0) return;

      ctx.clearRect(0, 0, state.w, state.h);

      // лёгкая дымка
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

    function frame(ts: number) {
      lastFrameAtRef.current = ts;

      // fade слой
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
      if (reduced) return;
      if (document.visibilityState !== "visible") return;

      runningRef.current = true;
      lastFrameAtRef.current = performance.now();
      rafRef.current = window.requestAnimationFrame(frame);
    }

    // ===== Resize (через очередь, чтобы iOS/RO не клинил) =====
    let resizeQueued = false;

    function resizeNow() {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));

      // не дергаем если реально то же самое
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

    function queueResize() {
      if (resizeQueued) return;
      resizeQueued = true;
      window.requestAnimationFrame(() => {
        resizeQueued = false;
        resizeNow();
      });
    }

    // ===== Watchdog (фикс "завис кадр") =====
    const watchdog = window.setInterval(() => {
      if (reduced) return;
      if (document.visibilityState !== "visible") return;

      const now = performance.now();
      const dt = now - (lastFrameAtRef.current || 0);

      // если rAF "уснул" — перезапускаем
      if (runningRef.current && dt > 1500) {
        start();
      }

      // если почему-то не running — тоже пинаем
      if (!runningRef.current && dt > 1500) {
        start();
      }
    }, 900);

    // "пинок" после событий Safari/iOS
    const poke = () => {
      if (reduced) return;
      if (document.visibilityState !== "visible") return;
      if (!runningRef.current) start();
    };

    const onVis = () => {
      if (document.visibilityState === "hidden") stop();
      else {
        queueResize();
        start();
      }
    };

    const onFocus = () => {
      queueResize();
      poke();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      // после bfcache Safari часто отдаёт "застывший" кадр
      if (e.persisted) {
        queueResize();
        start();
      } else {
        queueResize();
        poke();
      }
    };

    const onPageHide = () => stop();

    const onMql = () => {
      reduced = !!mql?.matches;
      queueResize();
      if (reduced) stop();
      else start();
    };

    mql?.addEventListener?.("change", onMql);

    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);

    // На iOS во время/после скролла rAF иногда “засыпает”
    window.addEventListener("scroll", poke, { passive: true });
    window.addEventListener("touchend", poke, { passive: true });
    window.addEventListener("resize", queueResize);
    window.addEventListener("orientationchange", queueResize);

    const ro = new ResizeObserver(queueResize);
    ro.observe(host);

    // первичная инициализация
    queueResize();
    start();

    return () => {
      stop();
      window.clearInterval(watchdog);
      ro.disconnect();

      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);

      window.removeEventListener("scroll", poke as any);
      window.removeEventListener("touchend", poke as any);
      window.removeEventListener("resize", queueResize);
      window.removeEventListener("orientationchange", queueResize);

      mql?.removeEventListener?.("change", onMql);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={["bcMatrixBg", className].filter(Boolean).join(" ")}
      style={{
        position: "absolute",
        inset: 0,
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
