import React from "react";

export type MatrixBackgroundProps = {
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
};

type MatrixStream = {
  y: number;
  speed: number;
  trail: number;
  alpha: number;
  xJitter: number;
  brightHead: boolean;
};

type MatrixLayer = {
  fontSize: number;
  columnWidth: number;
  streams: MatrixStream[];
  alphaScale: number;
  speedScale: number;
  glow: boolean;
};

const GLYPHS =
  "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+<>";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomGlyph() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0] || "0";
}

/**
 * The original BlackCrown falling-glyph background, upgraded in one canvas:
 * - two depth layers instead of one flat field
 * - brighter stream heads and smoother trails
 * - adaptive density/FPS/DPR for mobile Safari
 * - static frame for reduced-motion users
 */
export function MatrixBackground(props: MatrixBackgroundProps) {
  const { className, style, intensity = 1 } = props;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const resizeFrameRef = React.useRef<number | null>(null);
  const watchdogRef = React.useRef<number | null>(null);
  const lastFrameTsRef = React.useRef(0);
  const lastDrawTsRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia?.("(pointer: coarse)");
    let reduced = !!reducedMotion?.matches;
    let coarse = !!coarsePointer?.matches;

    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      layers: [] as MatrixLayer[],
    };

    const frameMs = () => 1000 / (coarse ? 24 : 30);

    function buildLayer(options: {
      fontSize: number;
      spacing: number;
      alphaScale: number;
      speedScale: number;
      glow: boolean;
      trailMin: number;
      trailMax: number;
    }): MatrixLayer {
      const columnWidth = Math.max(12, options.fontSize * options.spacing);
      const columns = Math.max(8, Math.ceil(state.width / columnWidth));
      const streams = Array.from({ length: columns }, () => ({
        y: randomBetween(-state.height * 0.35, state.height),
        speed: randomBetween(1.5, 4.6),
        trail: Math.round(randomBetween(options.trailMin, options.trailMax)),
        alpha: randomBetween(0.58, 1),
        xJitter: randomBetween(-options.fontSize * 0.12, options.fontSize * 0.12),
        brightHead: Math.random() > 0.46,
      }));

      return {
        fontSize: options.fontSize,
        columnWidth,
        streams,
        alphaScale: options.alphaScale,
        speedScale: options.speedScale,
        glow: options.glow,
      };
    }

    function configureLayers() {
      const desktop = state.width >= 900;
      const nearFont = desktop ? 22 : 20;
      const farFont = desktop ? 14 : 13;
      const mobileDensityScale = coarse ? 1.12 : 1;

      state.layers = [
        buildLayer({
          fontSize: farFont,
          spacing: 1.62 * mobileDensityScale,
          alphaScale: 0.32,
          speedScale: 0.48,
          glow: false,
          trailMin: 4,
          trailMax: 8,
        }),
        buildLayer({
          fontSize: nearFont,
          spacing: 1.08 * mobileDensityScale,
          alphaScale: 0.94,
          speedScale: 0.92,
          glow: true,
          trailMin: 5,
          trailMax: 11,
        }),
      ];
    }

    function drawLayer(layer: MatrixLayer, advance: boolean, dtMultiplier: number) {
      ctx.font = `700 ${layer.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "top";
      ctx.imageSmoothingEnabled = false;

      layer.streams.forEach((stream, index) => {
        const x = index * layer.columnWidth + stream.xJitter;

        for (let trailIndex = stream.trail - 1; trailIndex >= 0; trailIndex -= 1) {
          const y = stream.y - trailIndex * layer.fontSize;
          if (y < -layer.fontSize || y > state.height + layer.fontSize) continue;

          const trailProgress = 1 - trailIndex / Math.max(1, stream.trail);
          const alpha = Math.pow(trailProgress, 1.72) * stream.alpha * layer.alphaScale;
          const isHead = trailIndex === 0;

          if (isHead) {
            ctx.fillStyle = stream.brightHead
              ? `rgba(225, 248, 255, ${Math.min(1, alpha * 1.1)})`
              : `rgba(123, 211, 255, ${Math.min(1, alpha)})`;

            if (layer.glow && stream.brightHead) {
              ctx.shadowColor = "rgba(76, 181, 255, 0.78)";
              ctx.shadowBlur = coarse ? 5 : 8;
            }
          } else {
            const cyanBias = trailIndex <= 2 ? 205 : 181;
            ctx.fillStyle = `rgba(72, ${cyanBias}, 255, ${Math.min(0.82, alpha)})`;
          }

          ctx.fillText(randomGlyph(), x, y);
          ctx.shadowBlur = 0;
        }

        if (!advance) return;

        stream.y += stream.speed * layer.speedScale * intensity * dtMultiplier;

        if (stream.y - stream.trail * layer.fontSize > state.height + layer.fontSize * 2) {
          stream.y = -randomBetween(layer.fontSize * 2, Math.max(layer.fontSize * 5, state.height * 0.22));
          stream.speed = randomBetween(1.5, 4.6);
          stream.trail = Math.max(4, Math.round(randomBetween(5, layer.glow ? 12 : 9)));
          stream.alpha = randomBetween(0.58, 1);
          stream.brightHead = Math.random() > 0.46;
        }
      });
    }

    function drawStatic() {
      ctx.save();
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, state.width, state.height);
      state.layers.forEach((layer) => drawLayer(layer, false, 1));
      ctx.restore();
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dprCap = coarse ? 1.5 : 2;
      const dpr = Math.max(1, Math.min(dprCap, window.devicePixelRatio || 1));

      state.width = Math.max(1, Math.floor(rect.width));
      state.height = Math.max(1, Math.floor(rect.height));
      state.dpr = dpr;

      canvas.width = Math.floor(state.width * dpr);
      canvas.height = Math.floor(state.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      configureLayers();
      drawStatic();

      const now = performance.now();
      lastFrameTsRef.current = now;
      lastDrawTsRef.current = now;
    }

    function requestResize() {
      if (resizeFrameRef.current != null) return;
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        resize();
      });
    }

    function stop() {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function frame(timestamp: number) {
      lastFrameTsRef.current = timestamp;
      const interval = frameMs();
      const previous = lastDrawTsRef.current || timestamp - interval;

      if (timestamp - previous < interval) {
        rafRef.current = window.requestAnimationFrame(frame);
        return;
      }

      const dtMultiplier = Math.max(0.55, Math.min(2.35, (timestamp - previous) / 16.6667));
      lastDrawTsRef.current = timestamp;

      ctx.save();
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.fillStyle = coarse ? "rgba(0, 0, 0, 0.18)" : "rgba(0, 0, 0, 0.145)";
      ctx.fillRect(0, 0, state.width, state.height);
      state.layers.forEach((layer) => drawLayer(layer, true, dtMultiplier));
      ctx.restore();

      rafRef.current = window.requestAnimationFrame(frame);
    }

    function start() {
      stop();
      if (reduced || document.visibilityState === "hidden") return;

      const now = performance.now();
      lastFrameTsRef.current = now;
      lastDrawTsRef.current = now;
      rafRef.current = window.requestAnimationFrame(frame);
    }

    function onReducedMotionChange() {
      reduced = !!reducedMotion?.matches;
      if (reduced) {
        stop();
        drawStatic();
      } else {
        start();
      }
    }

    function onPointerModeChange() {
      coarse = !!coarsePointer?.matches;
      requestResize();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") stop();
      else start();
    }

    window.addEventListener("resize", requestResize, { passive: true });
    window.addEventListener("orientationchange", requestResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.visualViewport?.addEventListener?.("resize", requestResize, { passive: true });
    reducedMotion?.addEventListener?.("change", onReducedMotionChange);
    coarsePointer?.addEventListener?.("change", onPointerModeChange);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(requestResize) : null;
    resizeObserver?.observe(canvas);

    watchdogRef.current = window.setInterval(() => {
      if (reduced || document.visibilityState !== "visible") return;
      const now = performance.now();
      if (rafRef.current == null || now - lastFrameTsRef.current > 1800) start();
    }, 1400);

    resize();
    start();

    return () => {
      stop();
      resizeObserver?.disconnect();

      if (resizeFrameRef.current != null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }

      if (watchdogRef.current != null) {
        window.clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }

      window.removeEventListener("resize", requestResize);
      window.removeEventListener("orientationchange", requestResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.visualViewport?.removeEventListener?.("resize", requestResize);
      reducedMotion?.removeEventListener?.("change", onReducedMotionChange);
      coarsePointer?.removeEventListener?.("change", onPointerModeChange);
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

export default MatrixBackground;
