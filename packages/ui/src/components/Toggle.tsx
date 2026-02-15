import React from "react";

export function Toggle(props: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="bc-row" style={{ justifyContent: "space-between", gap: 14 }}>
      <div className="bc-col" style={{ gap: 2 }}>
        <div style={{ fontWeight: 650 }}>{props.label}</div>
        {props.description ? <div className="bc-p">{props.description}</div> : null}
      </div>

      <button
        className="bc-focus bc-tap bc-motion"
        role="switch"
        aria-checked={props.value}
        onClick={() => props.onChange(!props.value)}
        style={{
          width: 54,
          height: 32,
          borderRadius: 999,
          border: "1px solid var(--stroke)",
          background: props.value
            ? "linear-gradient(180deg, rgba(140,180,255,0.92), rgba(110,150,255,0.68))"
            : "rgba(255,255,255,0.08)",
          position: "relative",
          cursor: "pointer",
          transition: "transform 140ms ease, opacity 140ms ease, background 140ms ease"
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: props.value ? 26 : 3,
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "rgba(10,12,18,0.86)",
            boxShadow: "0 10px 18px rgba(0,0,0,0.28)",
            transition: "left 160ms ease"
          }}
        />
      </button>
    </div>
  );
}
