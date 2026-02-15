import React from "react";

export function Tabs<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ id: T; label: string }>;
}) {
  return (
    <div
      className="bc-card"
      style={{
        padding: 6,
        display: "inline-flex",
        gap: 6,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)"
      }}
    >
      {props.items.map((it) => {
        const active = it.id === props.value;
        return (
          <button
            key={it.id}
            className="bc-focus bc-motion bc-tap"
            onClick={() => props.onChange(it.id)}
            style={{
              border: "1px solid var(--stroke)",
              borderRadius: 999,
              padding: "10px 12px",
              background: active ? "rgba(255,255,255,0.14)" : "transparent",
              color: "var(--text)",
              cursor: "pointer",
              transition: "transform 140ms ease, opacity 140ms ease, background 140ms ease"
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
