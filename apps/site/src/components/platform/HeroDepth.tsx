import { useId } from "react";

/** Architectural planes remain decorative: every link and all type stay on the page plane. */
export function HeroDepth() {
  const metalId = `depth-metal-${useId().replace(/:/g, "")}`;
  return (
    <div className="platHeroDepth" aria-hidden="true">
      <div className="platDepthAtmosphere platDepthLayer" data-parallax-layer data-parallax-scroll="-52" data-parallax-pointer="-12" />
      <div className="platDepthChamber platDepthLayer" data-parallax-layer data-parallax-scroll="34" data-parallax-pointer="-18">
        <svg viewBox="0 0 800 660" fill="none" focusable="false">
          <defs>
            <linearGradient id={metalId} x1="160" y1="40" x2="730" y2="640" gradientUnits="userSpaceOnUse">
              <stop stopColor="#424c51" /><stop offset=".42" stopColor="#171e22" /><stop offset="1" stopColor="#090d10" />
            </linearGradient>
          </defs>
          <path d="M268 43 706 124 754 501 274 630 116 331Z M316 115 633 166 670 451 325 542 202 326Z" fill={`url(#${metalId})`} fillRule="evenodd" />
          <path d="m268 43 438 81 48 377-480 129-158-299Z" stroke="#80959f" strokeOpacity=".24" />
          <path d="m316 115 317 51 37 285-345 91-123-216Z" stroke="#b6c8cf" strokeOpacity=".26" />
          <path d="m116 331 86-5m72 304 51-88m381-418-73 42m121 335-84-50" stroke="#9eb3bd" strokeOpacity=".14" />
          <path d="m346 153 252 40 29 233-284 75-99-175Z" stroke="#7ca2ad" strokeOpacity=".12" />
          <path d="m268 43 48 72m-42 515 51-88" stroke="#bce0e7" strokeOpacity=".48" />
        </svg>
      </div>
      <div className="platDepthFloor platDepthLayer" data-parallax-layer data-parallax-scroll="72" data-parallax-pointer="8"><span /></div>
      <div className="platDepthEdge platDepthLayer" data-parallax-layer data-parallax-scroll="138" data-parallax-pointer="30"><span /></div>
    </div>
  );
}
