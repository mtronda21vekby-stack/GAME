import React from "react";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

export type SpringGlowProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;

  /** CSS color string; default uses orange accent token if present */
  color?: string;
  /** 0..1, default 0.55 */
  intensity?: number;
  /** px, default 220 */
  radius?: number;
  /** disable glow */
  disabled?: boolean;
};

export function SpringGlow(props: SpringGlowProps) {
  const {
    className,
    style,
    children,
    color,
    intensity = 0.55,
    radius = 220,
    disabled,
  } = props;

  const reduced = usePrefersReducedMotion();
  const on = !disabled && !reduced;

  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);

  const setXY = React.useCallback((x: number, y: number) => {
    const el = hostRef.current;
    if (!el) return;
    el.style.setProperty("--glow-x", `${x}px`);
    el.style.setProperty("--glow-y", `${y}px`);
  }, []);

  const onMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!on) return;
      const el = hostRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setXY(x, y));
    },
    [on, setXY]
  );

  React.useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const glowColor =
    color ?? "rgba(var(--bc-accent-rgb, 255,106,0)," + String(intensity) + ")";

  return (
    <div
      ref={hostRef}
      className={className}
      onPointerEnter={() => on && setActive(true)}
      onPointerLeave={() => setActive(false)}
      onPointerMove={onMove}
      style={{
        position: "relative",
        transform: "translateZ(0)",
        ...style,
      }}
    >
      {/* glow layer */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: (style?.borderRadius as any) ?? 22,
          pointerEvents: "none",
          opacity: on && active ? 1 : 0,
          transition: on ? "opacity 180ms ease" : undefined,
          background: on
            ? `radial-gradient(${radius}px ${radius}px at var(--glow-x, 50%) var(--glow-y, 30%), ${glowColor} 0%, rgba(0,0,0,0) 60%)`
            : "none",
          filter: on ? "blur(0px)" : undefined,
          mixBlendMode: "screen",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
