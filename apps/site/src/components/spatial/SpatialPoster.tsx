import { useId } from "react";

/** Lightweight original composition shown before WebGL and when it is unavailable. */
export function SpatialPoster() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="spatialPoster" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`room-${id}`} x2="0" y2="1"><stop stopColor="#061014"/><stop offset=".6" stopColor="#060d14"/><stop offset="1" stopColor="#132a30"/></linearGradient>
        <linearGradient id={`metal-${id}`} x1="0" x2="1"><stop stopColor="#24434b"/><stop offset=".28" stopColor="#acc7c8"/><stop offset=".46" stopColor="#928da6"/><stop offset=".58" stopColor="#c6d6cc"/><stop offset=".75" stopColor="#455e68"/><stop offset="1" stopColor="#17252e"/></linearGradient>
        <radialGradient id={`light-${id}`}><stop stopColor="#79b9c6" stopOpacity=".25"/><stop offset="1" stopColor="#79b9c6" stopOpacity="0"/></radialGradient>
      </defs>
      <path fill={`url(#room-${id})`} d="M0 0h1600v1000H0z"/>
      <ellipse cx="1090" cy="430" rx="640" ry="480" fill={`url(#light-${id})`}/>
      <g className="spatialPosterBrand">
      <path d="M1040 390c-260 140 320 560 150 770M1190 390c260 160-320 560-150 770" fill="none" stroke={`url(#metal-${id})`} strokeWidth="5" opacity=".8"/>
      <path d="m875 555 45 170 360-1 48-170-107 76-111-164-112 163Z" fill={`url(#metal-${id})`} stroke="#819aa7"/>
      <path d="m920 725 20 36h320l20-37" fill="#182a35" stroke="#537887"/>
      <path d="M945 748h295" stroke="#96dce2" strokeOpacity=".6"/>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(index => <circle key={index} cx={760+(index*73)%670} cy={210+(index*109)%760} r={index%3+1} fill={index%4===0 ? "#ad6943" : "#7bb5c1"} opacity=".4"/>)}
      </g>
    </svg>
  );
}
