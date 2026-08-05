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

export const SiteIcons = {
  home: strokeIcon(`
    <path d="m3.8 10.6 8.2-6.7 8.2 6.7"/>
    <path d="M5.7 9.5v9.1h12.6V9.5"/>
    <path d="M9.6 18.6v-5.3h4.8v5.3"/>
  `),
  games: strokeIcon(`
    <path d="M8.1 8.1h7.8a4.7 4.7 0 0 1 4.55 5.88l-.72 2.78a2.35 2.35 0 0 1-3.85 1.17l-1.15-1.03H9.27l-1.15 1.03a2.35 2.35 0 0 1-3.85-1.17l-.72-2.78A4.7 4.7 0 0 1 8.1 8.1Z"/>
    <path d="M7.2 11.2v3.2M5.6 12.8h3.2"/>
    <path d="M15.9 12.2h.01M18 14.1h.01"/>
  `),
  cart: strokeIcon(`
    <path d="M3.4 4.8h2l1.55 9.1a2 2 0 0 0 1.97 1.66h7.88a2 2 0 0 0 1.94-1.53l1.13-4.64H6.2"/>
    <circle cx="9.4" cy="19" r="1"/>
    <circle cx="17.2" cy="19" r="1"/>
  `),
  user: strokeIcon(`
    <circle cx="12" cy="8" r="3.25"/>
    <path d="M5.5 19.2c.72-3.35 3.1-5.3 6.5-5.3s5.78 1.95 6.5 5.3"/>
  `),
} as const;
