# BlackCrown Site Baseline

Captured on 2026-08-09 before production source changes on
`refactor/blackcrown-aaa-foundation-v3`.

## Git

- Repository: `mtronda21vekby-stack/GAME`
- Source of truth: `origin/main`
- Base SHA: `144e9df529702813e55bdbb2521d3229f2180923`
- Baseline worktree: clean
- Previous local branch left untouched: `refactor/blackcrown-aaa-foundation-v2`
- Protected legacy branch left untouched: `max/blackcrown-v34-final`
- Applicable `AGENTS.md`: none found

## Environment

- Node: `v24.15.0`
- pnpm through Corepack: `9.15.4`
- `corepack enable`: unavailable because `/usr/local/bin` is not writable (`EACCES`)
- `corepack pnpm`: operational and used for every package command
- Frozen install: passed after network access was available; 128 packages reused

## Baseline Gates

| Command | Result | Evidence |
| --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | PASS | lockfile unchanged, 128 packages reused |
| `corepack pnpm --filter @blackcrown/site test:assets` | PASS | Crown `600x750`, EvoFish `800x500` |
| `corepack pnpm --filter @blackcrown/site typecheck` | PASS | `tsc --noEmit`, no diagnostics |
| `corepack pnpm --filter @blackcrown/site build` | PASS WITH WARNING | single JS chunk exceeds 500 kB |
| `npm run build:prod` | PASS WITH WARNING | site/game/lobby built and root dist assembled |
| `git diff --check` | PASS | no whitespace errors |

The full production build reports an existing protected-app warning for
`/game/assets/lobby/lobby-bg-station-16x9.png`. It does not fail the build and is
outside this site's scope.

## Source Inventory

| Metric | Baseline |
| --- | ---: |
| Tracked files in requested audit scope | 268 |
| Tracked files under `apps/site` | 183 |
| Commerce/auth API files in scope | 6 |
| Tracked package files | 73 |
| Workflow files inspected | 5 |
| TS/TSX files under `apps/site/src` | 75 |
| CSS files under `apps/site/src` | 40 |
| Raw CSS bytes | 346,645 |
| `!important` occurrences | 1,549 |
| Duplicate selector names (normalized audit parser) | 561 |
| Extra duplicate selector definitions | 1,179 |

Duplicate selector counts use a deterministic audit parser that strips comments,
normalizes whitespace and counts repeated selector heads. Keyframe steps and
at-rules are excluded.

## Emitted Bundles

| Asset | Minified | Gzip |
| --- | ---: | ---: |
| `dist/assets/index-By5h9emA.js` | 613.25 kB | 141.18 kB |
| `dist/assets/index-BnEFGbgt.css` | 214.05 kB | 40.96 kB |
| `dist/index.html` | 5.79 kB | 2.31 kB |

- Initial route chunks: one JS entry and one global CSS asset.
- Async route chunks: none.
- Vite warning: the single 613.25 kB JS entry exceeds the standard 500 kB
  threshold.
- On a `390x844` viewport, `atomic-mobile-styles.ts` injects a second
  `363,409`-character full-site stylesheet into the DOM from JavaScript.
- Mobile has 30 stylesheet objects; desktop has 29.

## Runtime Systems

Counts below cover code reachable from `apps/site/src/main.tsx` before changes.

| Runtime primitive | Baseline |
| --- | ---: |
| Global `scroll` listeners | 6 |
| Global `resize` listeners | 10 |
| Global `pointermove` listeners | 4 |
| `orientationchange` listeners | 2 |
| `MutationObserver` instances | 5 |
| `IntersectionObserver` instances | 4 |
| Independent files scheduling RAF | 7 |

RAF owners are `main.tsx`, `App.tsx`, `HeroParallaxDirector`,
`MobileParallaxDirector`, `MotionDirector`, `PremiumParallaxDirector`, and
`CinematicExperience`.

## Browser Baseline

| Viewport | DOM nodes | Nodes below `#root` | Scroll width | Client width | Scroll height |
| --- | ---: | ---: | ---: | ---: | ---: |
| `1440x900` | 364 | 300 | 1440 | 1440 | 9121 |
| `390x844` | 330 | 265 | 390 | 390 | 8545 |

- Desktop and mobile had no horizontal overflow in the captured first frame.
- Both current key-art images reported non-zero natural dimensions and
  `data-key-art-status="ready"`.
- Home initially reported cinematic phase `0`.
- Desktop mounts Dock, Music, MatrixDepthEngine and all global motion directors.
- Mobile mounts Dock, Music, MobileParallaxDirector and the remaining global
  motion directors.

## Routes

Current site routes:

`/`, `/about`, `/support`, `/privacy`, `/terms`, `/store`, `/cart`, `/checkout`,
`/checkout/success`, `/account`, `/admin`.

Protected external application routes are `/game/**`, `/lobby/**` and `/games/**`.
They correctly bypass site-router interception in the baseline.

Known route defects:

- An unknown URL is rewritten to Home in render state while the incorrect URL
  remains in the address bar.
- All pages are statically imported into the Home entry.
- SiteMusic is mounted globally, including checkout/admin; route CSS hides some
  overlays after mount instead of preventing their runtime creation.

## Key Art

| Asset | Baseline state |
| --- | --- |
| Hero Crown | Valid WebP, `600x750`, eager, high fetch priority, runtime check |
| EvoFish | Valid WebP, `800x500`, eager, runtime check |
| World Gate | Procedural CSS scene, no approved raster asset |
| CROWN//FRONT | Existing semantic SVG preview; final approved AAA art absent |
| Network core | Procedural CSS plus existing `/assets/site/neon/network.svg` |
| OpenGraph image | No dedicated OpenGraph image found |
| PWA icons | PNG and SVG variants present under `public/pwa/icons` |
| Store raster art | No raster product art found; current cards use CSS art direction |

The CROWN//FRONT WebGL directory under `apps/site/public/games/crown-front/**`
is protected and was not modified or used as an art source.
