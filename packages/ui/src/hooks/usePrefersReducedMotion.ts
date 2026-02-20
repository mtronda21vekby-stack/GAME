import * as React from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(() => {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;
    const onChange = () => setReduced(!!mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}
