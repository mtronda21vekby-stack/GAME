import * as React from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

type Props = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

export function SpringGlow({ className, style, children }: Props) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = React.useState(false);

  const onMove = React.useCallback((e: React.PointerEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
    const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
    el.style.setProperty("--bc-hx", `${x.toFixed(2)}%`);
    el.style.setProperty("--bc-hy", `${y.toFixed(2)}%`);
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={["bcSpringGlow", className].filter(Boolean).join(" ")}
      style={style}
      data-hover={hover ? "true" : "false"}
      onPointerEnter={reduced ? undefined : () => setHover(true)}
      onPointerLeave={reduced ? undefined : () => setHover(false)}
      onPointerMove={onMove}
    >
      {children}
    </div>
  );
}
