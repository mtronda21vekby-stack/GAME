import React from "react";
import "../styles/reactor-fx.css";

export type ReactorFXTone = "cyan" | "orange" | "violet";
export type ReactorFXSize = "compact" | "default" | "large";

export type ReactorFXProps = {
  tone?: ReactorFXTone;
  size?: ReactorFXSize;
  intensity?: number;
  className?: string;
  mobileLite?: boolean;
};

type ReactorStyle = React.CSSProperties & {
  "--bc-reactor-intensity"?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ReactorFX({
  tone = "cyan",
  size = "default",
  intensity = 1,
  className,
  mobileLite = true,
}: ReactorFXProps) {
  const safeIntensity = clamp(intensity, 0.35, 1.5);
  const style: ReactorStyle = {
    "--bc-reactor-intensity": safeIntensity.toFixed(2),
  };

  return (
    <div
      className={["bcReactorFX", `bcReactorFX--${size}`, className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-mobile-lite={mobileLite ? "true" : "false"}
      style={style}
      aria-hidden="true"
    >
      <span className="bcReactorFX__aura" />
      <span className="bcReactorFX__ring bcReactorFX__ring--outer" />
      <span className="bcReactorFX__ring bcReactorFX__ring--middle" />
      <span className="bcReactorFX__ring bcReactorFX__ring--inner" />
      <span className="bcReactorFX__core" />
      <span className="bcReactorFX__spark bcReactorFX__spark--a" />
      <span className="bcReactorFX__spark bcReactorFX__spark--b" />
      <span className="bcReactorFX__spark bcReactorFX__spark--c" />
      <span className="bcReactorFX__beam" />
    </div>
  );
}

export default ReactorFX;
