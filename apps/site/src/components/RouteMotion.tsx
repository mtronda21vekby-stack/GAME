import React from "react";
import { useLocation } from "react-router-dom";

/**
 * Premium route transitions without deps.
 * - Cross-fade + subtle blur
 * - Keeps previous screen for a short time to avoid flashes
 * - Respects prefers-reduced-motion via CSS
 */
export function RouteMotion(props: { children: React.ReactNode }) {
  const loc = useLocation();

  const [prevKey, setPrevKey] = React.useState<string | null>(null);
  const [prevNode, setPrevNode] = React.useState<React.ReactNode | null>(null);
  const [phase, setPhase] = React.useState<"idle" | "swap">("idle");

  const currentKey = `${loc.pathname}${loc.search}${loc.hash}`;

  React.useEffect(() => {
    // If first mount — no animation layer
    if (prevKey === null) {
      setPrevKey(currentKey);
      return;
    }

    if (prevKey === currentKey) return;

    // Capture previous render as "outgoing" layer
    setPrevNode(props.children);
    setPhase("swap");

    // Let outgoing exist briefly, then drop it
    const t = window.setTimeout(() => {
      setPrevNode(null);
      setPhase("idle");
    }, 220);

    setPrevKey(currentKey);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  return (
    <div className={`bcRouteStage ${phase === "swap" ? "bcRouteStageSwap" : ""}`}>
      {/* outgoing */}
      {prevNode ? <div className="bcRouteLayer bcRouteOut">{prevNode}</div> : null}

      {/* incoming */}
      <div className="bcRouteLayer bcRouteIn" key={currentKey}>
        {props.children}
      </div>
    </div>
  );
}

export default RouteMotion;
