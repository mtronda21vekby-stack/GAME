import React from "react";

const CORE_GLYPHS = ["B", "L", "A", "C", "K", "0", "1", "C", "R", "O", "W", "N"] as const;

export type DigitalCrownCoreSize = "compact" | "default" | "large";

export type DigitalCrownCoreProps = {
  /** Controls the responsive diameter of the core. */
  size?: DigitalCrownCoreSize;
  /** Scales glow and energy intensity without changing geometry. */
  intensity?: number;
  /** Enables pointer-driven parallax on fine pointers. */
  interactive?: boolean;
  /** Optional extra class for scene-specific positioning. */
  className?: string;
  /** Main label displayed below the core. */
  label?: string;
  /** Secondary status line displayed below the label. */
  status?: string;
  /** Accessible name when the core is not decorative. */
  ariaLabel?: string;
  /** Makes the core keyboard-activatable when supplied. */
  onActivate?: () => void;
  /** Decorative cores are hidden from assistive technology. */
  decorative?: boolean;
};

type CoreStyle = React.CSSProperties & {
  "--bc-core-size"?: string;
  "--bc-core-intensity"?: string;
  "--bc-core-x"?: string;
  "--bc-core-y"?: string;
  "--bc-core-rx"?: string;
  "--bc-core-ry"?: string;
};

type GlyphStyle = React.CSSProperties & {
  "--glyph-index"?: number;
};

const SIZE_VALUES: Record<DigitalCrownCoreSize, string> = {
  compact: "clamp(270px, 72vw, 430px)",
  default: "clamp(360px, 46vw, 690px)",
  large: "clamp(440px, 52vw, 790px)",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;

    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener?.("change", sync);

    return () => media.removeEventListener?.("change", sync);
  }, []);

  return reduced;
}

function sanitizeSvgId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function DigitalCrownCore({
  size = "default",
  intensity = 1,
  interactive = true,
  className,
  label = "DIGITAL CROWN CORE",
  status = "BLACKCROWN NETWORK / ONLINE",
  ariaLabel = "BlackCrown Digital Crown Core",
  onActivate,
  decorative = true,
}: DigitalCrownCoreProps) {
  const coreRef = React.useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const reactId = sanitizeSvgId(React.useId()) || "bcDigitalCore";
  const effectiveDecorative = decorative && !onActivate;
  const safeIntensity = clamp(intensity, 0.35, 1.5);

  const ids = React.useMemo(
    () => ({
      metal: `${reactId}-metal`,
      edge: `${reactId}-edge`,
      energy: `${reactId}-energy`,
      energyHot: `${reactId}-energy-hot`,
      glass: `${reactId}-glass`,
      glow: `${reactId}-glow`,
      softGlow: `${reactId}-soft-glow`,
      shadow: `${reactId}-shadow`,
      mask: `${reactId}-mask`,
    }),
    [reactId]
  );

  const resetParallax = React.useCallback(() => {
    const element = coreRef.current;
    if (!element) return;

    element.style.setProperty("--bc-core-x", "0.5");
    element.style.setProperty("--bc-core-y", "0.5");
    element.style.setProperty("--bc-core-rx", "0deg");
    element.style.setProperty("--bc-core-ry", "0deg");
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion || event.pointerType !== "mouse") return;

    const element = coreRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const tiltX = (0.5 - y) * 6.5;
    const tiltY = (x - 0.5) * 8.5;

    element.style.setProperty("--bc-core-x", x.toFixed(4));
    element.style.setProperty("--bc-core-y", y.toFixed(4));
    element.style.setProperty("--bc-core-rx", `${tiltX.toFixed(2)}deg`);
    element.style.setProperty("--bc-core-ry", `${tiltY.toFixed(2)}deg`);
  };

  React.useEffect(() => {
    if (reducedMotion) resetParallax();
  }, [reducedMotion, resetParallax]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onActivate();
  };

  const rootStyle: CoreStyle = {
    "--bc-core-size": SIZE_VALUES[size],
    "--bc-core-intensity": safeIntensity.toFixed(2),
    "--bc-core-x": "0.5",
    "--bc-core-y": "0.5",
    "--bc-core-rx": "0deg",
    "--bc-core-ry": "0deg",
  };

  const classes = ["bcBrandCore", "bcDigitalCrownCore", `bcDigitalCrownCore--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={coreRef}
      className={classes}
      style={rootStyle}
      data-size={size}
      data-interactive={interactive && !reducedMotion ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-hidden={effectiveDecorative ? true : undefined}
      aria-label={effectiveDecorative ? undefined : ariaLabel}
      role={effectiveDecorative ? undefined : onActivate ? "button" : "img"}
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={resetParallax}
      onPointerCancel={resetParallax}
    >
      <div className="bcBrandCore__aura bcDigitalCrownCore__aura" />
      <div className="bcBrandCore__portal bcBrandCore__portal--outer" />
      <div className="bcBrandCore__portal bcBrandCore__portal--middle" />
      <div className="bcBrandCore__portal bcBrandCore__portal--inner" />
      <div className="bcBrandCore__axis bcBrandCore__axis--horizontal" />
      <div className="bcBrandCore__axis bcBrandCore__axis--vertical" />

      <svg
        className="bcBrandCore__object bcDigitalCrownCore__object"
        viewBox="0 0 600 600"
        focusable="false"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={ids.metal} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#284655" />
            <stop offset="0.13" stopColor="#0b1218" />
            <stop offset="0.42" stopColor="#020406" />
            <stop offset="0.7" stopColor="#0d1a22" />
            <stop offset="1" stopColor="#010203" />
          </linearGradient>

          <linearGradient id={ids.edge} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#074b60" stopOpacity="0.28" />
            <stop offset="0.26" stopColor="#37e7ff" stopOpacity="0.9" />
            <stop offset="0.52" stopColor="#d6fdff" />
            <stop offset="0.76" stopColor="#00cfee" />
            <stop offset="1" stopColor="#7156ff" stopOpacity="0.58" />
          </linearGradient>

          <radialGradient id={ids.energy} cx="50%" cy="46%" r="56%">
            <stop offset="0" stopColor="#f1ffff" stopOpacity="0.98" />
            <stop offset="0.12" stopColor="#9cf8ff" stopOpacity="0.94" />
            <stop offset="0.32" stopColor="#16d9fb" stopOpacity="0.72" />
            <stop offset="0.62" stopColor="#076d91" stopOpacity="0.32" />
            <stop offset="1" stopColor="#021018" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={ids.energyHot} cx="48%" cy="42%" r="54%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.2" stopColor="#b6fbff" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#29dff6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#4d3dff" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={ids.glass} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dbfdff" stopOpacity="0.2" />
            <stop offset="0.45" stopColor="#1b839b" stopOpacity="0.06" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
          </linearGradient>

          <filter id={ids.glow} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={ids.softGlow} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="24" />
          </filter>

          <filter id={ids.shadow} x="-45%" y="-45%" width="190%" height="205%">
            <feDropShadow dx="0" dy="28" stdDeviation="26" floodColor="#000000" floodOpacity="0.88" />
          </filter>

          <mask id={ids.mask}>
            <rect width="600" height="600" fill="white" />
            <circle cx="300" cy="306" r="62" fill="black" />
          </mask>
        </defs>

        <g className="bcDigitalCrownCore__field" filter={`url(#${ids.softGlow})`}>
          <circle cx="300" cy="304" r="148" fill="#00d9ff" opacity={0.08 * safeIntensity} />
          <circle cx="300" cy="304" r="98" fill="#6550ff" opacity={0.08 * safeIntensity} />
        </g>

        <g className="bcBrandCore__halo bcDigitalCrownCore__halo" filter={`url(#${ids.glow})`}>
          <circle
            cx="300"
            cy="300"
            r="184"
            fill="none"
            stroke={`url(#${ids.edge})`}
            strokeWidth="2"
            strokeDasharray="2 14"
          />
          <circle cx="300" cy="300" r="154" fill="none" stroke="#59efff" strokeOpacity="0.2" strokeWidth="1" />
          <circle cx="300" cy="300" r="128" fill="none" stroke="#7862ff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="8 12" />
        </g>

        <circle className="bcBrandCore__energy" cx="300" cy="310" r="124" fill={`url(#${ids.energy})`} />
        <circle
          className="bcDigitalCrownCore__energyHot"
          cx="300"
          cy="310"
          r="76"
          fill={`url(#${ids.energyHot})`}
          opacity={0.78 * safeIntensity}
        />

        <g className="bcDigitalCrownCore__reactor" filter={`url(#${ids.glow})`}>
          <circle cx="300" cy="310" r="72" fill="#02070b" stroke="#68f0ff" strokeOpacity="0.42" strokeWidth="2" />
          <circle cx="300" cy="310" r="55" fill={`url(#${ids.glass})`} stroke="#b9fbff" strokeOpacity="0.3" strokeWidth="2" />
          <path d="M300 268 337 289v42l-37 21-37-21v-42l37-21Z" fill="#031017" stroke="#8ff7ff" strokeWidth="3" />
          <circle cx="300" cy="310" r="17" fill="#d9ffff" />
          <circle cx="300" cy="310" r="8" fill="#ffffff" />
        </g>

        <g className="bcBrandCore__crown bcDigitalCrownCore__crown" filter={`url(#${ids.shadow})`}>
          <path
            d="M124 371 160 194l104 108 36-162 36 162 104-108 36 177-39 86H163l-39-86Z"
            fill={`url(#${ids.metal})`}
            stroke={`url(#${ids.edge})`}
            strokeWidth="4"
            strokeLinejoin="round"
          />

          <path
            d="m177 357 20-94 84 88 19-84 19 84 84-88 20 94-20 44H197l-20-44Z"
            fill="#010407"
            fillOpacity="0.84"
            stroke="#6cf1ff"
            strokeOpacity="0.26"
            strokeWidth="2"
            strokeLinejoin="round"
            mask={`url(#${ids.mask})`}
          />

          <path d="M181 417h238l-18 47H199l-18-47Z" fill="#03080d" stroke={`url(#${ids.edge})`} strokeWidth="3" />
          <path d="M211 438h178" stroke="#c8fdff" strokeOpacity="0.42" strokeWidth="2" />
          <path d="M226 449h148" stroke="#00d9ff" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="4 7" />

          <circle cx="160" cy="194" r="9" fill="#071219" stroke="#54edff" strokeWidth="3" />
          <circle cx="300" cy="140" r="11" fill="#071219" stroke="#c2fdff" strokeWidth="3" />
          <circle cx="440" cy="194" r="9" fill="#071219" stroke="#7158ff" strokeWidth="3" />

          <path
            className="bcBrandCore__circuit"
            d="M194 405h60l46-47 46 47h60"
            fill="none"
            stroke="#43eaff"
            strokeWidth="2"
          />
          <path
            className="bcBrandCore__circuit bcBrandCore__circuit--delay"
            d="M229 331h36l35-34 35 34h36"
            fill="none"
            stroke="#8d78ff"
            strokeWidth="2"
          />
          <path
            className="bcDigitalCrownCore__circuitSecondary"
            d="M205 386h30l20-20m140 20h-30l-20-20"
            fill="none"
            stroke="#bafcff"
            strokeOpacity="0.34"
            strokeWidth="1.5"
          />
        </g>

        <g className="bcBrandCore__center bcDigitalCrownCore__center" filter={`url(#${ids.glow})`}>
          <path d="m300 326 29 29-29 29-29-29 29-29Z" fill="#010609" stroke="#a3f9ff" strokeWidth="3" />
          <circle cx="300" cy="355" r="11" fill="#c8ffff" />
          <circle cx="300" cy="355" r="4" fill="#ffffff" />
        </g>
      </svg>

      <div className="bcBrandCore__glyphs bcDigitalCrownCore__glyphs">
        {CORE_GLYPHS.map((glyph, index) => (
          <span key={`${glyph}-${index}`} style={{ "--glyph-index": index } as GlyphStyle}>
            {glyph}
          </span>
        ))}
      </div>

      <div className="bcDigitalCrownCore__telemetry" aria-hidden="true">
        <span>CORE / {Math.round(safeIntensity * 100).toString().padStart(3, "0")}</span>
        <span>LINK STABLE</span>
      </div>

      <div className="bcBrandCore__label bcDigitalCrownCore__label">
        <span>BLACKCROWN</span>
        <strong>{label}</strong>
        <small>{status}</small>
      </div>
    </div>
  );
}

export default DigitalCrownCore;
