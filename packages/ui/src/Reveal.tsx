import React from "react";

export type RevealProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;

  /** HTML тег-обёртка (по умолчанию div) */
  as?: keyof JSX.IntrinsicElements;

  /** Анимировать только один раз (по умолчанию true) */
  once?: boolean;

  /** IntersectionObserver threshold (по умолчанию 0.15) */
  threshold?: number;

  /** IntersectionObserver rootMargin (по умолчанию "0px 0px -12% 0px") */
  rootMargin?: string;

  /** Смещение по Y в px до появления (по умолчанию 10) */
  offsetY?: number;

  /** Задержка анимации в ms (по умолчанию 0) */
  delayMs?: number;

  /** Длительность анимации в ms (по умолчанию 420) */
  durationMs?: number;
};

function prefersReducedMotion(): boolean {
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

export function Reveal(props: RevealProps) {
  const {
    children,
    className,
    style,
    as = "div",
    once = true,
    threshold = 0.15,
    rootMargin = "0px 0px -12% 0px",
    offsetY = 10,
    delayMs = 0,
    durationMs = 420,
  } = props;

  const ref = React.useRef<HTMLElement | null>(null);
  const [shown, setShown] = React.useState(() => {
    // reduced-motion => сразу показываем, без анимации
    if (typeof window === "undefined") return true;
    return prefersReducedMotion();
  });

  React.useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    // если IO нет — просто показываем
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    let stopped = false;

    const io = new IntersectionObserver(
      (entries) => {
        if (stopped) return;
        const e = entries[0];
        if (!e) return;

        if (e.isIntersecting) {
          setShown(true);
          if (once) {
            stopped = true;
            io.disconnect();
          }
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);

    return () => {
      stopped = true;
      io.disconnect();
    };
  }, [shown, once, threshold, rootMargin]);

  const Comp = as as any;

  const motionStyle: React.CSSProperties =
    shown
      ? {
          opacity: 1,
          transform: "translate3d(0,0,0)",
        }
      : {
          opacity: 0,
          transform: `translate3d(0, ${Math.max(-200, Math.min(200, offsetY))}px, 0)`,
        };

  const animStyle: React.CSSProperties = prefersReducedMotion()
    ? {}
    : {
        transitionProperty: "transform, opacity",
        transitionDuration: `${Math.max(120, durationMs)}ms`,
        transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
        transitionDelay: `${Math.max(0, delayMs)}ms`,
        willChange: "transform, opacity",
      };

  return (
    <Comp
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={className}
      style={{
        ...animStyle,
        ...motionStyle,
        ...style,
      }}
    >
      {children}
    </Comp>
  );
}

export default Reveal;
