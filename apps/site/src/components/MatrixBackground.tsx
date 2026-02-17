import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  opacity?: number;
  speed?: number;
  density?: number;
  fontSize?: number;
  color?: string;
  glow?: boolean;
};

export default function MatrixBackground({
  opacity = 0.028,
  speed = 0.18,
  density = 1.12,
  fontSize = 14,
  color = "rgba(90, 190, 255, 0.90)",
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

      cols = Math.max(18, Math.floor((w / cfg.fontSize) * cfg.density));
      drops = new Array(cols).fill(0).map(() => Math.random() * h);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cfg.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    };

    const draw = () => {
      const W = width / DPR;
      const H = height / DPR;

      // 1) “black-lock” — держим фон реально чёрным (важнее, чем хвосты)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, W, H);

      // 2) лёгкая виньетка, чтобы края были глубже/киношнее
      const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0.00)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // 3) символы
      ctx.fillStyle = cfg.color;
      if (cfg.glow) {
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      const stepX = W / cols;
      for (let i = 0; i < cols; i++) {
        const x = i * stepX;
        const y = drops[i];

        const c = chars[(Math.random() * chars.length) | 0];
        ctx.globalAlpha = cfg.opacity;
        ctx.fillText(c, x, y);

        drops[i] = y + (cfg.fontSize * (0.72 + cfg.speed));
        if (drops[i] > H + cfg.fontSize * 10 && Math.random() > 0.975) {
          drops[i] = -cfg.fontSize * (10 + Math.random() * 30);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

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
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
