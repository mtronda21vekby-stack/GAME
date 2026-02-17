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
  opacity = 0.035,
  speed = 0.09,
  density = 1.45,
  fontSize = 13,
  color = "rgba(90, 190, 255, 0.86)",
  glow = false,
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

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let w = 0;
    let h = 0;
    let cols = 0;
    let drops: number[] = [];
    let lastT = performance.now();

    const getViewport = () => {
      const vv = window.visualViewport;
      const W = Math.floor(vv?.width ?? window.innerWidth);
      const H = Math.floor(vv?.height ?? window.innerHeight);
      return { W, H };
    };

    const resize = () => {
      const { W, H } = getViewport();

      w = Math.floor(W * DPR);
      h = Math.floor(H * DPR);

      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cfg.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

      cols = Math.max(18, Math.floor((W / cfg.fontSize) * cfg.density));
      drops = new Array(cols).fill(0).map(() => Math.random() * H - H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    };

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(40, now - lastT);
      lastT = now;

      const W = w / DPR;
      const H = h / DPR;

      const fade = Math.max(0.05, Math.min(0.16, 0.085 + cfg.speed * 0.35));

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = cfg.color;
      ctx.shadowBlur = cfg.glow ? 6 : 0;
      ctx.shadowColor = cfg.color;

      const stepX = W / cols;
      const dy = cfg.fontSize * (0.22 + cfg.speed * 0.9) * (dt / 16.67);

      for (let i = 0; i < cols; i++) {
        const x = i * stepX;
        const y = drops[i];

        ctx.globalAlpha = cfg.opacity;
        ctx.fillText(chars[(Math.random() * chars.length) | 0], x, y);

        drops[i] = y + dy;

        if (drops[i] > H + cfg.fontSize * 12 && Math.random() > 0.975) {
          drops[i] = -cfg.fontSize * (12 + Math.random() * 40);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    const vv = window.visualViewport;
    window.addEventListener("resize", resize, { passive: true });
    vv?.addEventListener("resize", resize, { passive: true });
    vv?.addEventListener("scroll", resize, { passive: true });

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      vv?.removeEventListener("resize", resize as any);
      vv?.removeEventListener("scroll", resize as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cfg]);

  return (
    <div className="bc-matrix-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
