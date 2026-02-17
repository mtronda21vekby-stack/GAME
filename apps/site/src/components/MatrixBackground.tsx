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
  opacity = 0.055,
  speed = 0.14,
  density = 1.35,
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

    let w = 0;
    let h = 0;
    let cols = 0;
    let drops: number[] = [];

    const resize = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;

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
      drops = new Array(cols).fill(0).map(() => Math.random() * H);
    };

    let last = performance.now();

    const draw = (t: number) => {
      const dt = Math.min(32, t - last); // стабилизируем
      last = t;

      const W = w / DPR;
      const H = h / DPR;

      // держим фон чёрным, но мягко (чтобы матрица не убивала контент)
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = cfg.color;
      ctx.shadowBlur = cfg.glow ? 6 : 0;
      ctx.shadowColor = cfg.color;

      const stepX = W / cols;

      // скорость через dt: кинематографично и одинаково на 60/120fps
      const dy = cfg.fontSize * (0.55 + cfg.speed) * (dt / 16.67);

      for (let i = 0; i < cols; i++) {
        const x = i * stepX;
        const y = drops[i];

        // немного вариации альфы “плотнее”
        const a = cfg.opacity * (0.75 + Math.random() * 0.5);
        ctx.globalAlpha = a;

        ctx.fillText(chars[(Math.random() * chars.length) | 0], x, y);

        drops[i] = y + dy;

        if (drops[i] > H + cfg.fontSize * 10 && Math.random() > 0.985) {
          drops[i] = -cfg.fontSize * (10 + Math.random() * 30);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // стартовый чёрный
    ctx.clearRect(0, 0, w / DPR, h / DPR);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, w / DPR, h / DPR);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cfg]);

  return (
    <div className="bc-matrix-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
