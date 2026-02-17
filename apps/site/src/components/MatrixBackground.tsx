import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  opacity?: number;
  speed?: number;   // теперь это множитель скорости (0.06..0.14 киношно)
  density?: number; // 1.3..1.8 плотнее
  fontSize?: number;
  color?: string;
  glow?: boolean;
};

export default function MatrixBackground({
  opacity = 0.055,
  speed = 0.095,
  density = 1.6,
  fontSize = 14,
  color = "rgba(90, 190, 255, 0.95)",
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

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let W = 0;
    let H = 0;
    let cols = 0;
    let drops: number[] = [];

    const getViewport = () => {
      const vv = window.visualViewport;
      const w = Math.floor(vv?.width ?? window.innerWidth);
      const h = Math.floor(vv?.height ?? window.innerHeight);
      return { w, h };
    };

    const resize = () => {
      const vp = getViewport();
      W = vp.w;
      H = vp.h;

      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cfg.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

      cols = Math.max(22, Math.floor((W / cfg.fontSize) * cfg.density));
      drops = new Array(cols).fill(0).map(() => Math.random() * H);
    };

    const draw = () => {
      // Киношный шлейф без “затемнения страницы”
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = cfg.color;
      ctx.shadowBlur = cfg.glow ? 8 : 0;
      ctx.shadowColor = cfg.color;

      const stepX = W / cols;

      for (let i = 0; i < cols; i++) {
        const x = (i * stepX) | 0;
        const y = drops[i];

        // “голова” ярче
        ctx.globalAlpha = Math.min(1, cfg.opacity * 1.6);
        ctx.fillText(chars[(Math.random() * chars.length) | 0], x, y);

        // хвост (чуть видимый) — создаёт плотность, но не убивает UI
        ctx.globalAlpha = cfg.opacity * 0.35;
        ctx.fillText(chars[(Math.random() * chars.length) | 0], x, y - cfg.fontSize);

        drops[i] = y + cfg.fontSize * cfg.speed * 6.2;
        if (drops[i] > H + cfg.fontSize * 24) {
          drops[i] = -cfg.fontSize * (8 + Math.random() * 22);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", onResize, { passive: true });

    // старт: чистый чёрный кадр
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, W, H);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cfg]);

  return (
    <div className="bc-matrix-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
