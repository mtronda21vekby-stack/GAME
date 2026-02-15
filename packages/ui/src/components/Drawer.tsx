import React, { useEffect } from "react";

export function Drawer(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(0,0,0,0.45)"
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <aside
        className="glassStrong bc-motion"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: "min(420px, 92vw)",
          padding: "max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))",
          transform: "translateX(0)",
          overflow: "auto"
        }}
      >
        <div className="bc-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div className="bc-h2">{props.title}</div>
          <button className="bc-focus bc-tap" onClick={props.onClose} style={{
            borderRadius: 999,
            border: "1px solid var(--stroke)",
            background: "rgba(255,255,255,0.06)",
            color: "var(--text)"
          }}>✕</button>
        </div>
        {props.children}
      </aside>
    </div>
  );
}
