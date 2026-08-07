import React from "react";

type RouteMotionProps = {
  children: React.ReactNode;
  /** Опционально: можно передать вручную ключ (если где-то используется) */
  routeKey?: string;
};

/**
 * Lightweight route wrapper WITHOUT react-router-dom.
 * Tracks route changes via popstate + patched pushState/replaceState.
 * Keeps build stable and does not require extra deps.
 */
export function RouteMotion(props: RouteMotionProps) {
  const { children, routeKey } = props;

  const getKey = React.useCallback(() => {
    if (routeKey) return routeKey;
    try {
      return `${window.location.pathname}${window.location.search}${window.location.hash}`;
    } catch {
      return "route";
    }
  }, [routeKey]);

  const [key, setKey] = React.useState<string>(() => getKey());

  React.useEffect(() => {
    // Prevent double-patch in dev/hmr
    const w = window as any;
    if (!w.__bc_routeMotionPatched) {
      w.__bc_routeMotionPatched = true;

      const notify = () => {
        try {
          window.dispatchEvent(new Event("bc:locationchange"));
        } catch {
          // ignore
        }
      };

      try {
        const { pushState, replaceState } = window.history;

        window.history.pushState = function (...args: Parameters<History["pushState"]>) {
          const r = pushState.apply(window.history, args);
          notify();
          return r;
        };

        window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
          const r = replaceState.apply(window.history, args);
          notify();
          return r;
        };
      } catch {
        // ignore
      }

      window.addEventListener("popstate", notify);
      window.addEventListener("hashchange", notify);
    }

    const onChange = () => setKey(getKey());

    window.addEventListener("bc:locationchange", onChange);
    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);

    return () => {
      window.removeEventListener("bc:locationchange", onChange);
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("hashchange", onChange);
    };
  }, [getKey]);

  // Key forces remount on route changes (useful for transitions if you have CSS animations).
  return (
    <div key={key} data-route={key} style={{ width: "100%" }}>
      {children}
    </div>
  );
}

export default RouteMotion;
