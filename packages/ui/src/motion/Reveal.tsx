import * as React from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

type Props = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  rootMargin?: string; // например "0px 0px -10% 0px"
}>;

export function Reveal({ className, style, rootMargin = "0px 0px -10% 0px", children }: Props) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setInView(true);
        }
      },
      { root: null, threshold: 0.12, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduced, rootMargin]);

  return (
    <div ref={ref} className={["bcReveal", className].filter(Boolean).join(" ")} style={style} data-in={inView ? "true" : "false"}>
      {children}
    </div>
  );
}
