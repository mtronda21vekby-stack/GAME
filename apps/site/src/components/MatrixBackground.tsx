import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  opacity?: number;
  speed?: number;      // 0.15..0.35
  density?: number;    // 0.8..1.8
  fontSize?: number;   // 12..18
  color?: string;      // rgba(...)
  glow?: boolean;
};

export default function MatrixBackground({
  opacity = 0.06,
  speed = 0.20,
  density = 1.45,
  fontSize = 14,
  color = "rgba(90, 190, 255, 0.92)",
  glow = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const cfg = useMemo(
    () => ({ opacity, speed, density, fontSize, color, glow }),
    [opacity, speed, density, fontSize, color, glow]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let width = 0;
    let height = 0;
    let cols = 0;
    let drops: number[] = [];

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      width = Math.floor(w * DPR);
      height = Math.floor(h * DPR);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      cols = Math.max(16, Math.floor((w / cfg.fontSize) * cfg.density));
      drops = new Array(cols).fill(0).map(() => Math.random() * h);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cfg.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    };

    const draw = () => {
      // прозрачный fade, чтобы “киношно” тянулось
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0,0,0,${0.12})`;
      ctx.fillRect(0, 0, width / DPR, height / DPR);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = cfg.color;

      if (cfg.glow) {
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      const stepX = (width / DPR) / cols;
      for (let i = 0; i < cols; i++) {
        const x = i * stepX;
        const y = drops[i];

        const c = chars[(Math.random() * chars.length) | 0];
        ctx.globalAlpha = cfg.opacity;
        ctx.fillText(c, x, y);

        drops[i] = y + (cfg.fontSize * (0.75 + cfg.speed));
        if (drops[i] > (height / DPR) + cfg.fontSize * 10 && Math.random() > 0.975) {
          drops[i] = -cfg.fontSize * (10 + Math.random() * 30);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // старт с чистого чёрного
    ctx.clearRect(0, 0, width / DPR, height / DPR);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width / DPR, height / DPR);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cfg]);

  return (
    <div
      className="bc-matrix-bg"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,          // КЛЮЧ: фон
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          opacity: 1,
        }}
      />
    </div>
  );
}
