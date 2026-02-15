import React from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  leftIconSrc?: string;
  rightIconSrc?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const v = props.variant ?? "primary";
  const size = props.size ?? "md";

  const pad = size === "lg" ? "14px 16px" : "10px 14px";
  const font = size === "lg" ? 15.5 : 14.5;

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
    padding: pad,
    minHeight: 44,
    minWidth: 44,
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    border: "1px solid var(--stroke)",
    cursor: props.disabled ? "not-allowed" : "pointer",
    fontSize: font,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    transition: "transform 140ms ease, opacity 140ms ease, background 140ms ease",
    willChange: "transform, opacity",
    opacity: props.disabled ? 0.55 : 1
  };

  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg, rgba(140,180,255,0.92), rgba(110,150,255,0.68))",
      color: "rgba(10,12,18,0.92)",
      borderColor: "rgba(255,255,255,0.18)"
    },
    secondary: {
      background: "rgba(255,255,255,0.08)",
      color: "var(--text)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text)"
    }
  };

  return (
    <button
      type={props.type ?? "button"}
      className={`bc-focus bc-motion ${props.className ?? ""}`}
      aria-label={props.ariaLabel}
      disabled={props.disabled}
      onClick={props.disabled ? undefined : props.onClick}
      style={{
        ...base,
        ...styles[v]
      }}
      onMouseDown={(e) => {
        if (props.disabled) return;
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      {props.leftIconSrc ? <img alt="" src={props.leftIconSrc} width={18} height={18} style={{ opacity: 0.9 }} /> : null}
      <span>{props.children}</span>
      {props.rightIconSrc ? <img alt="" src={props.rightIconSrc} width={18} height={18} style={{ opacity: 0.9 }} /> : null}
    </button>
  );
}
