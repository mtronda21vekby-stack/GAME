export const HeroArt = {
  aurora: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g0" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1022"/>
      <stop offset="1" stop-color="#050810"/>
    </linearGradient>
    <radialGradient id="g1" cx="30%" cy="25%" r="70%">
      <stop offset="0" stop-color="#7BA7FF" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#7BA7FF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="68%" cy="45%" r="70%">
      <stop offset="0" stop-color="#8E7BFF" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#8E7BFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g3" cx="55%" cy="80%" r="80%">
      <stop offset="0" stop-color="#57E6D6" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#57E6D6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1600" height="900" fill="url(#g0)"/>
  <rect width="1600" height="900" fill="url(#g1)"/>
  <rect width="1600" height="900" fill="url(#g2)"/>
  <rect width="1600" height="900" fill="url(#g3)"/>

  <g opacity="0.55">
    <path d="M-100 210 C 420 120, 680 140, 980 260 C 1250 360, 1520 360, 1740 280"
          fill="none" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="70" stroke-linecap="round"/>
    <path d="M-120 520 C 350 420, 720 460, 1010 600 C 1270 720, 1500 720, 1750 620"
          fill="none" stroke="#7BA7FF" stroke-opacity="0.10" stroke-width="88" stroke-linecap="round"/>
    <path d="M-80 690 C 420 620, 720 650, 980 740 C 1210 820, 1490 840, 1760 780"
          fill="none" stroke="#57E6D6" stroke-opacity="0.08" stroke-width="62" stroke-linecap="round"/>
  </g>

  <g fill="#FFFFFF" opacity="0.18">
    <circle cx="120" cy="90" r="2"/><circle cx="260" cy="160" r="1"/><circle cx="410" cy="70" r="2"/>
    <circle cx="560" cy="140" r="1"/><circle cx="720" cy="110" r="2"/><circle cx="880" cy="190" r="1"/>
    <circle cx="1040" cy="80" r="2"/><circle cx="1180" cy="150" r="1"/><circle cx="1320" cy="120" r="2"/>
    <circle cx="1460" cy="210" r="1"/><circle cx="1540" cy="120" r="2"/><circle cx="90" cy="260" r="1"/>
    <circle cx="240" cy="310" r="2"/><circle cx="380" cy="260" r="1"/><circle cx="520" cy="330" r="2"/>
    <circle cx="660" cy="290" r="1"/><circle cx="800" cy="320" r="2"/><circle cx="940" cy="270" r="1"/>
    <circle cx="1080" cy="340" r="2"/><circle cx="1220" cy="300" r="1"/><circle cx="1360" cy="330" r="2"/>
    <circle cx="1500" cy="280" r="1"/><circle cx="160" cy="430" r="2"/><circle cx="300" cy="470" r="1"/>
    <circle cx="440" cy="420" r="2"/><circle cx="610" cy="480" r="1"/><circle cx="760" cy="430" r="2"/>
    <circle cx="910" cy="490" r="1"/><circle cx="1050" cy="440" r="2"/><circle cx="1210" cy="470" r="1"/>
    <circle cx="1370" cy="420" r="2"/><circle cx="1520" cy="480" r="1"/>
  </g>
</svg>
`)}`,

  noise: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
  </filter>
  <rect width="320" height="320" filter="url(#n)" opacity="0.20"/>
</svg>
`)}`,

  cardWave: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="360" viewBox="0 0 900 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B132A"/>
      <stop offset="1" stop-color="#071022"/>
    </linearGradient>
    <radialGradient id="glow" cx="25%" cy="30%" r="70%">
      <stop offset="0" stop-color="#7BA7FF" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#7BA7FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="360" rx="28" fill="url(#bg)"/>
  <rect width="900" height="360" rx="28" fill="url(#glow)"/>
  <path d="M-30 250 C 180 170, 320 190, 480 250 C 650 320, 770 330, 930 280"
        fill="none" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="64" stroke-linecap="round"/>
  <path d="M-40 290 C 200 220, 360 240, 520 300 C 680 360, 800 365, 950 330"
        fill="none" stroke="#57E6D6" stroke-opacity="0.10" stroke-width="46" stroke-linecap="round"/>
</svg>
`)}`,
} as const;
