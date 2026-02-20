import * as React from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

type Props = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  depth?: number; // 0..1 (0.12 default)
}>;

export function ParallaxLayer({ className, style, depth = 0.12, children }: Props) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    let raf: number | null = null;

    const tick = () => {
      raf = null;
      // берём глобальные CSS vars от cursorStore (на html)
      const cs = getComputedStyle(document.documentElement);
      const nx = parseFloat(cs.getPropertyValue("--bc-cnx")) || 0.5;
      const ny = parseFloat(cs.getPropertyValue("--bc-cny")) || 0.4;

      const dx = (nx - 0.5) * 2; // -1..1
      const dy = (ny - 0.5) * 2;

      const tx = dx * 10 * depth;
      const ty = dy * 10 * depth;

      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
    };

    const loop = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        tick();
        loop();
      });
    };

    loop();
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [reduced, depth]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
