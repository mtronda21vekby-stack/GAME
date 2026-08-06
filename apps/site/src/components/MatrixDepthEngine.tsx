import React from "react";
import "../styles/matrix-depth-engine.css";

export type MatrixDepthQuality = "auto" | "low" | "high";

export type MatrixDepthEngineProps = {
  quality?: MatrixDepthQuality;
  intensity?: number;
  className?: string;
};

type DepthStyle = React.CSSProperties & {
  "--bc-matrix-depth-intensity"?: string;
};

type GlyphStyle = React.CSSProperties & {
  "--bc-glyph-index"?: number;
};

const GLYPHS = ["01", "BC", "N", "X", "//", "A7", "R", "C", "K", "11", "V3", "∞"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useMedia(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;

    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, [query]);

  return matches;
}

export function MatrixDepthEngine({ quality = "auto", intensity = 1, className }: MatrixDepthEngineProps) {
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMedia("(pointer: coarse)");
  const narrowViewport = useMedia("(max-width: 760px)");
  const saveData = React.useMemo(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return Boolean(connection?.saveData);
  }, []);

  const resolvedQuality = quality === "auto" ? (saveData || coarsePointer || narrowViewport ? "low" : "high") : quality;
  const safeIntensity = clamp(intensity, 0.35, 1.35);
  const glyphCount = resolvedQuality === "high" ? 24 : 12;
  const classes = ["bcMatrixDepthEngine", className].filter(Boolean).join(" ");
  const style: DepthStyle = { "--bc-matrix-depth-intensity": safeIntensity.toFixed(2) };

  return (
    <div
      className={classes}
      style={style}
      data-quality={resolvedQuality}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="bcMatrixDepthEngine__plane bcMatrixDepthEngine__plane--far" />
      <div className="bcMatrixDepthEngine__plane bcMatrixDepthEngine__plane--middle" />

      <div className="bcMatrixDepthEngine__near">
        {Array.from({ length: glyphCount }, (_, index) => (
          <span key={`${GLYPHS[index % GLYPHS.length]}-${index}`} style={{ "--bc-glyph-index": index } as GlyphStyle}>
            {GLYPHS[index % GLYPHS.length]}
          </span>
        ))}
      </div>

      <div className="bcMatrixDepthEngine__cursor" />
      <div className="bcMatrixDepthEngine__beam bcMatrixDepthEngine__beam--top" />
      <div className="bcMatrixDepthEngine__beam bcMatrixDepthEngine__beam--bottom" />
      <div className="bcMatrixDepthEngine__scan" />
      <div className="bcMatrixDepthEngine__fog" />
      <div className="bcMatrixDepthEngine__grain" />
      <div className="bcMatrixDepthEngine__vignette" />
    </div>
  );
}

export default MatrixDepthEngine;
