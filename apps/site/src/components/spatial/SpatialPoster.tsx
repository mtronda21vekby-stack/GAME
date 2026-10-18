import { useId } from "react";

/** Quiet background keeps the native interface complete before WebGL is available. */
export function SpatialPoster() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="spatialPoster" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`room-${id}`} x2="0" y2="1"><stop stopColor="#061014"/><stop offset=".6" stopColor="#060d14"/><stop offset="1" stopColor="#132a30"/></linearGradient>
        <radialGradient id={`light-${id}`}><stop stopColor="#79b9c6" stopOpacity=".25"/><stop offset="1" stopColor="#79b9c6" stopOpacity="0"/></radialGradient>
      </defs>
      <path fill={`url(#room-${id})`} d="M0 0h1600v1000H0z"/>
      <ellipse cx="1090" cy="430" rx="640" ry="480" fill={`url(#light-${id})`}/>
    </svg>
  );
}
