import React from "react";
import "../styles/glass-system.css";

export type GlassMaterial = "premium" | "frosted" | "reactor" | "metal";
export type GlassTone = "cyan" | "violet" | "orange" | "neutral";

export type GlassSurfaceProps = {
  as?: "div" | "section" | "article";
  material?: GlassMaterial;
  tone?: GlassTone;
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
  ariaLabel?: string;
};

export function GlassSurface({
  as = "div",
  material = "premium",
  tone = "cyan",
  className,
  children,
  interactive = false,
  ariaLabel,
}: GlassSurfaceProps) {
  const Component = as;
  const classes = ["bcGlassSurface", `bcGlassSurface--${material}`, interactive ? "is-interactive" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} data-glass-tone={tone} aria-label={ariaLabel}>
      <span className="bcGlassSurface__light" aria-hidden="true" />
      <span className="bcGlassSurface__edge" aria-hidden="true" />
      <span className="bcGlassSurface__noise" aria-hidden="true" />
      <div className="bcGlassSurface__content">{children}</div>
    </Component>
  );
}

export default GlassSurface;
