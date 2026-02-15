import React from "react";

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
};

export function ToastViewport(props: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: "max(12px, env(safe-area-inset-bottom))",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 60
      }}
    >
      {props.toasts.map((t) => (
        <div
          key={t.id}
          className="glass bc-motion"
          style={{
            width: "min(360px, calc(100vw - 24px))",
            padding: 12,
            borderRadius: 16
          }}
        >
          <div className="bc-row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 650 }}>{t.title}</div>
            <button
              className="bc-focus bc-tap"
              style={{
                border: "1px solid var(--stroke)",
                background: "rgba(255,255,255,0.06)",
                color: "var(--text)",
                borderRadius: 999
              }}
              onClick={() => props.onDismiss(t.id)}
            >
              ✕
            </button>
          </div>
          {t.message ? <div className="bc-p" style={{ marginTop: 6 }}>{t.message}</div> : null}
        </div>
      ))}
    </div>
  );
}
