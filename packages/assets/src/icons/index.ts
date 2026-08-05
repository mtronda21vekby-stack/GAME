// packages/assets/src/icons/index.ts
const toDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;

const strokeIcon = (body: string) =>
  toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="#FFFFFF" stroke-opacity="0.92" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        ${body}
      </g>
    </svg>
  `);

const crown = toDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="gold" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#FFF0C1"/>
        <stop offset="0.46" stop-color="#E2B55F"/>
        <stop offset="1" stop-color="#9C6824"/>
      </linearGradient>
    </defs>
    <path d="M3.4 7.2 7.8 12l4.2-7 4.2 7 4.4-4.8-1.4 10.1c-.18 1.25-1.25 2.2-2.51 2.2H7.31a2.54 2.54 0 0 1-2.51-2.2L3.4 7.2Z" fill="url(#gold)"/>
    <path d="M6.2 16.4h11.6" fill="none" stroke="#FFF4D5" stroke-opacity="0.72" stroke-width="1.15" stroke-linecap="round"/>
  </svg>
`);

const play = toDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.4 6.6c0-.86.94-1.39 1.68-.95l8.15 4.83a1.76 1.76 0 0 1 0 3.04l-8.15 4.83c-.74.44-1.68-.09-1.68-.95V6.6Z" fill="#FFFFFF" fill-opacity="0.94"/>
  </svg>
`);

const home = strokeIcon(`
  <path d="m3.8 10.6 8.2-6.7 8.2 6.7"/>
  <path d="M5.7 9.5v9.1h12.6V9.5"/>
  <path d="M9.6 18.6v-5.3h4.8v5.3"/>
`);

const games = strokeIcon(`
  <path d="M8.1 8.1h7.8a4.7 4.7 0 0 1 4.55 5.88l-.72 2.78a2.35 2.35 0 0 1-3.85 1.17l-1.15-1.03H9.27l-1.15 1.03a2.35 2.35 0 0 1-3.85-1.17l-.72-2.78A4.7 4.7 0 0 1 8.1 8.1Z"/>
  <path d="M7.2 11.2v3.2M5.6 12.8h3.2"/>
  <path d="M15.9 12.2h.01M18 14.1h.01"/>
`);

const user = strokeIcon(`
  <circle cx="12" cy="8" r="3.25"/>
  <path d="M5.5 19.2c.72-3.35 3.1-5.3 6.5-5.3s5.78 1.95 6.5 5.3"/>
`);

const cart = strokeIcon(`
  <path d="M3.4 4.8h2l1.55 9.1a2 2 0 0 0 1.97 1.66h7.88a2 2 0 0 0 1.94-1.53l1.13-4.64H6.2"/>
  <circle cx="9.4" cy="19" r="1"/>
  <circle cx="17.2" cy="19" r="1"/>
`);

const chat = strokeIcon(`
  <path d="M4.1 5.7A2.7 2.7 0 0 1 6.8 3h10.4a2.7 2.7 0 0 1 2.7 2.7v7.2a2.7 2.7 0 0 1-2.7 2.7h-6.4l-4.7 4v-4H6.8a2.7 2.7 0 0 1-2.7-2.7V5.7Z"/>
  <path d="M8 8.3h8M8 11.5h5.2"/>
`);

const settings = strokeIcon(`
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.1 13.2a7.4 7.4 0 0 0 0-2.4l2-1.55-2-3.45-2.48 1a7.9 7.9 0 0 0-2.08-1.2L14.2 3h-4.4l-.34 2.6a7.9 7.9 0 0 0-2.08 1.2l-2.48-1-2 3.45 2 1.55a7.4 7.4 0 0 0 0 2.4l-2 1.55 2 3.45 2.48-1a7.9 7.9 0 0 0 2.08 1.2l.34 2.6h4.4l.34-2.6a7.9 7.9 0 0 0 2.08-1.2l2.48 1 2-3.45-2-1.55Z"/>
`);

const heart = strokeIcon(`
  <path d="M20.5 8.7c0 4.9-8.5 10-8.5 10s-8.5-5.1-8.5-10A4.45 4.45 0 0 1 12 6.8a4.45 4.45 0 0 1 8.5 1.9Z"/>
`);

const close = strokeIcon(`
  <path d="m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8"/>
`);

const chevronDown = strokeIcon(`
  <path d="m6.2 9.1 5.8 5.8 5.8-5.8"/>
`);

const arrowLeft = strokeIcon(`
  <path d="M19 12H5M10.4 6.6 5 12l5.4 5.4"/>
`);

const arrowRight = strokeIcon(`
  <path d="M5 12h14M13.6 6.6 19 12l-5.4 5.4"/>
`);

const arrowUpRight = strokeIcon(`
  <path d="M7 17 17 7M9 7h8v8"/>
`);

const support = strokeIcon(`
  <path d="M4.2 13v-1.2a7.8 7.8 0 0 1 15.6 0V13"/>
  <path d="M4.2 12.2h2.4v5H5.8a1.6 1.6 0 0 1-1.6-1.6v-3.4ZM19.8 12.2h-2.4v5h.8a1.6 1.6 0 0 0 1.6-1.6v-3.4Z"/>
  <path d="M17.4 17.2c-.75 2-2.3 3-4.65 3H12"/>
`);

const menu = strokeIcon(`
  <path d="M5 7h14M5 12h14M5 17h14"/>
`);

export const Icons = {
  crown,
  play,
  home,
  games,
  user,
  cart,
  chat,
  settings,
  heart,
  close,
  chevronDown,
  arrowLeft,
  arrowRight,
  arrowUpRight,
  support,
  menu,
  fallback: crown,
} as const;
