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
  opacity = 0.06,
  speed = 0.11,
  density = 1.55,
  fontSize = 14,
  color = "rgba(90, 190, 255, 0.90)",
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
      const vv = window.visualViewport;
      const W = Math.floor((vv?.width ?? window.innerWidth));
      const H = Math.floor((vv?.height ?? window.innerHeight));

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

    const draw = () => {
      const W = w / DPR;
      const H = h / DPR;

      // ДЕРЖИМ ФОН ЧЁРНЫМ (чтобы не было синего “поля”)
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // Чем БОЛЬШЕ alpha — тем быстрее “смазывание” уходит в чёрный
      const fade = 0.55;
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = cfg.color;
      ctx.shadowBlur = cfg.glow ? 7 : 0;
      ctx.shadowColor = cfg.color;

      const stepX = W / cols;

      for (let i = 0; i < cols; i++) {
        const x = i * stepX;
        const y = drops[i];

        // маленький хвост (киношнее и плотнее визуально)
        const c0 = chars[(Math.random() * chars.length) | 0];
        const c1 = chars[(Math.random() * chars.length) | 0];
        const c2 = chars[(Math.random() * chars.length) | 0];

        ctx.globalAlpha = Math.max(0, cfg.opacity * 0.35);
        ctx.fillText(c0, x, y - cfg.fontSize * 2);

        ctx.globalAlpha = Math.max(0, cfg.opacity * 0.65);
        ctx.fillText(c1, x, y - cfg.fontSize);

        ctx.globalAlpha = Math.max(0, cfg.opacity);
        ctx.fillText(c2, x, y);

        // скорость падения: меньше = медленнее (как в кино)
        const v = cfg.fontSize * (0.55 + cfg.speed * 2.2);
        drops[i] = y + v;

        // перезапуск колонки
        if (drops[i] > H + cfg.fontSize * 12 && Math.random() > 0.975) {
          drops[i] = -cfg.fontSize * (12 + Math.random() * 40);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const vv = window.visualViewport;
    vv?.addEventListener("resize", resize, { passive: true });
    vv?.addEventListener("scroll", resize, { passive: true });

    // старт — чистый чёрный
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, w / DPR, h / DPR);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      vv?.removeEventListener("resize", resize);
      vv?.removeEventListener("scroll", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cfg]);

  return (
    <div className="bc-matrix-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
