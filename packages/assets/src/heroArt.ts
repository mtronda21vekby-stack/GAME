const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, " ");
const svg = (markup: string) => `data:image/svg+xml;charset=utf-8,${enc(markup)}`;

const AURORA = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <radialGradient id="g0" cx="30%" cy="20%" r="80%">
      <stop offset="0" stop-color="#7AA8FF" stop-opacity="0.50"/>
      <stop offset="0.45" stop-color="#6B5BFF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0B1022" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g1" cx="80%" cy="10%" r="75%">
      <stop offset="0" stop-color="#9B7CFF" stop-opacity="0.40"/>
      <stop offset="0.5" stop-color="#3E7BFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#0B1022" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="70%" cy="75%" r="90%">
      <stop offset="0" stop-color="#39E6D9" stop-opacity="0.18"/>
      <stop offset="0.55" stop-color="#1C8DFF" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#0B1022" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#0B1022" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#0B1022" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#0B1022" stop-opacity="0.70"/>
    </linearGradient>
    <filter id="blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="#0B1022"/>
  <g filter="url(#blur)">
    <circle cx="380" cy="220" r="520" fill="url(#g0)"/>
    <circle cx="1260" cy="120" r="520" fill="url(#g1)"/>
    <circle cx="1080" cy="720" r="620" fill="url(#g2)"/>
  </g>

  <rect width="1600" height="900" fill="url(#fade)"/>
</svg>
`);

const NOISE = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="matrix"
      values="1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.35 0"/>
  </filter>
  <rect width="220" height="220" filter="url(#n)"/>
</svg>
`);

const CARD_WAVE = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
  <defs>
    <linearGradient id="b" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0B1022"/>
      <stop offset="0.5" stop-color="#11204A"/>
      <stop offset="1" stop-color="#0B1022"/>
    </linearGradient>
    <linearGradient id="w" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#7AA8FF" stop-opacity="0.22"/>
      <stop offset="0.5" stop-color="#39E6D9" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#9B7CFF" stop-opacity="0.18"/>
    </linearGradient>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>

  <rect width="1200" height="420" rx="26" fill="url(#b)"/>
  <g filter="url(#soft)">
    <path d="M-30 310 C 180 230, 360 390, 560 300 C 760 210, 940 330, 1230 250 L 1230 460 L -30 460 Z"
      fill="url(#w)"/>
    <path d="M-40 270 C 170 190, 420 340, 620 250 C 820 160, 970 280, 1240 210"
      fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="6" stroke-linecap="round"/>
  </g>

  <circle cx="980" cy="110" r="160" fill="rgba(122,168,255,0.10)"/>
  <circle cx="980" cy="110" r="92" fill="rgba(155,124,255,0.08)"/>
</svg>
`);

const CARD_GRID = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
  <defs>
    <linearGradient id="b" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0B1022"/>
      <stop offset="0.55" stop-color="#0F1E40"/>
      <stop offset="1" stop-color="#0B1022"/>
    </linearGradient>
    <pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0 H0 V24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
    <radialGradient id="g" cx="40%" cy="30%" r="70%">
      <stop offset="0" stop-color="#7AA8FF" stop-opacity="0.22"/>
      <stop offset="0.45" stop-color="#39E6D9" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#0B1022" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="420" rx="26" fill="url(#b)"/>
  <rect width="1200" height="420" rx="26" fill="url(#p)"/>
  <rect width="1200" height="420" rx="26" fill="url(#g)"/>
  <circle cx="920" cy="160" r="170" fill="rgba(155,124,255,0.10)"/>
</svg>
`);

const CARD_NEON = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
  <defs>
    <linearGradient id="b" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0B1022"/>
      <stop offset="0.5" stop-color="#101B3A"/>
      <stop offset="1" stop-color="#0B1022"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="1200" height="420" rx="26" fill="url(#b)"/>
  <g filter="url(#glow)" opacity="0.85">
    <path d="M140 280 C 300 160, 470 340, 640 230 C 810 120, 960 250, 1120 150"
      fill="none" stroke="rgba(122,168,255,0.40)" stroke-width="8" stroke-linecap="round"/>
    <path d="M120 310 C 290 190, 470 360, 660 260 C 850 160, 980 290, 1140 210"
      fill="none" stroke="rgba(57,230,217,0.34)" stroke-width="6" stroke-linecap="round"/>
    <path d="M160 240 C 340 120, 520 310, 700 200 C 880 90, 980 220, 1120 120"
      fill="none" stroke="rgba(155,124,255,0.30)" stroke-width="5" stroke-linecap="round"/>
  </g>

  <circle cx="940" cy="150" r="180" fill="rgba(122,168,255,0.10)"/>
  <circle cx="940" cy="150" r="90" fill="rgba(57,230,217,0.06)"/>
</svg>
`);

export const HeroArt = {
  aurora: AURORA,
  noise: NOISE,
  cardWave: CARD_WAVE,
  cardGrid: CARD_GRID,
  cardNeon: CARD_NEON,
} as const;
