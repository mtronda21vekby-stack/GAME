import React from "react";

const GLYPHS = ["B", "L", "A", "C", "K", "0", "1", "C", "R", "O", "W", "N"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Brand-first hero object. The Matrix remains the environment; this core gives
 * it a single focal point without introducing a heavyweight 3D dependency.
 */
export function BrandCore() {
  const coreRef = React.useRef<HTMLDivElement | null>(null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;

    const element = coreRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    element.style.setProperty("--bc-core-x", x.toFixed(4));
    element.style.setProperty("--bc-core-y", y.toFixed(4));
    element.style.setProperty("--bc-core-rx", `${((0.5 - y) * 5.5).toFixed(2)}deg`);
    element.style.setProperty("--bc-core-ry", `${((x - 0.5) * 7).toFixed(2)}deg`);
  };

  const resetPointer = () => {
    const element = coreRef.current;
    if (!element) return;

    element.style.setProperty("--bc-core-x", "0.5");
    element.style.setProperty("--bc-core-y", "0.5");
    element.style.setProperty("--bc-core-rx", "0deg");
    element.style.setProperty("--bc-core-ry", "0deg");
  };

  return (
    <div
      ref={coreRef}
      className="bcBrandCore"
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="bcBrandCore__aura" />
      <div className="bcBrandCore__portal bcBrandCore__portal--outer" />
      <div className="bcBrandCore__portal bcBrandCore__portal--middle" />
      <div className="bcBrandCore__portal bcBrandCore__portal--inner" />
      <div className="bcBrandCore__axis bcBrandCore__axis--horizontal" />
      <div className="bcBrandCore__axis bcBrandCore__axis--vertical" />

      <svg className="bcBrandCore__object" viewBox="0 0 600 600" focusable="false">
        <defs>
          <linearGradient id="bc-core-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1c3442" />
            <stop offset="0.24" stopColor="#05090d" />
            <stop offset="0.58" stopColor="#0b151d" />
            <stop offset="1" stopColor="#010204" />
          </linearGradient>
          <linearGradient id="bc-core-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0d6f86" stopOpacity="0.25" />
            <stop offset="0.48" stopColor="#9cf7ff" />
            <stop offset="0.72" stopColor="#00d9ff" />
            <stop offset="1" stopColor="#5c44ff" stopOpacity="0.42" />
          </linearGradient>
          <radialGradient id="bc-core-energy" cx="50%" cy="48%" r="55%">
            <stop offset="0" stopColor="#d9fdff" stopOpacity="0.95" />
            <stop offset="0.18" stopColor="#4feeff" stopOpacity="0.78" />
            <stop offset="0.52" stopColor="#0786ab" stopOpacity="0.34" />
            <stop offset="1" stopColor="#031019" stopOpacity="0" />
          </radialGradient>
          <filter id="bc-core-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bc-core-shadow" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="24" stdDeviation="24" floodColor="#000000" floodOpacity="0.82" />
          </filter>
        </defs>

        <g className="bcBrandCore__halo" filter="url(#bc-core-glow)">
          <circle cx="300" cy="300" r="176" fill="none" stroke="url(#bc-core-edge)" strokeWidth="2" strokeDasharray="2 15" />
          <circle cx="300" cy="300" r="138" fill="none" stroke="#00d9ff" strokeOpacity="0.18" strokeWidth="1" />
        </g>

        <circle className="bcBrandCore__energy" cx="300" cy="310" r="112" fill="url(#bc-core-energy)" />

        <g className="bcBrandCore__crown" filter="url(#bc-core-shadow)">
          <path
            d="M128 371 163 199l101 105 36-158 36 158 101-105 35 172-38 83H166l-38-83Z"
            fill="url(#bc-core-metal)"
            stroke="url(#bc-core-edge)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="m181 357 18-88 83 84 18-79 18 79 83-84 18 88-18 42H199l-18-42Z"
            fill="#020509"
            fillOpacity="0.78"
            stroke="#5cefff"
            strokeOpacity="0.24"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M186 418h228l-17 43H203l-17-43Z" fill="#04090e" stroke="url(#bc-core-edge)" strokeWidth="3" />
          <path d="M214 437h172" stroke="#bafaff" strokeOpacity="0.34" strokeWidth="2" />

          <circle cx="163" cy="199" r="8" fill="#09131a" stroke="#4feeff" strokeWidth="3" />
          <circle cx="300" cy="146" r="10" fill="#09131a" stroke="#a6f9ff" strokeWidth="3" />
          <circle cx="437" cy="199" r="8" fill="#09131a" stroke="#654dff" strokeWidth="3" />

          <path className="bcBrandCore__circuit" d="M203 404h56l41-42 41 42h56" fill="none" stroke="#43eaff" strokeWidth="2" />
          <path className="bcBrandCore__circuit bcBrandCore__circuit--delay" d="M241 331h28l31-30 31 30h28" fill="none" stroke="#8b72ff" strokeWidth="2" />
        </g>

        <g className="bcBrandCore__center" filter="url(#bc-core-glow)">
          <path d="m300 326 27 27-27 27-27-27 27-27Z" fill="#020609" stroke="#8af5ff" strokeWidth="3" />
          <circle cx="300" cy="353" r="10" fill="#bafaff" />
        </g>
      </svg>

      <div className="bcBrandCore__glyphs">
        {GLYPHS.map((glyph, index) => (
          <span key={`${glyph}-${index}`} style={{ "--glyph-index": index } as React.CSSProperties}>
            {glyph}
          </span>
        ))}
      </div>

      <div className="bcBrandCore__label">
        <span>BLACKCROWN</span>
        <strong>NEXUS CORE</strong>
        <small>INTERACTIVE WORLDS / NETWORK ONLINE</small>
      </div>
    </div>
  );
}

export default BrandCore;
