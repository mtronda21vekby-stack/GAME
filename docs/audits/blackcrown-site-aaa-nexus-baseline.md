# BlackCrown AAA Nexus Baseline

Captured on 2026-08-09 before production source changes in the isolated V4
worktree. This baseline is the evidence point for foundation cleanup and the
local-only Nexus lab.

## Git Safety

- Repository: `mtronda21vekby-stack/GAME`
- Source of truth: `origin/main`
- Base SHA: `144e9df529702813e55bdbb2521d3229f2180923`
- Original checkout: `/Users/maksim/Documents/Frontline/GAME`
- Original branch: `refactor/blackcrown-aaa-foundation-v3`
- Original HEAD: `4d834a0638f0104a1837a9a6626a729316b97a32`
- Original worktree: clean; branch was eight commits ahead of `origin/main`
- Isolated worktree:
  `/Users/maksim/Documents/Frontline/GAME-blackcrown-aaa-nexus-20260809-102023`
- Local feature branch: `feature/blackcrown-aaa-nexus-local-20260809-102023`
- Protected legacy branch `max/blackcrown-v34-final`: not used or changed
- Applicable `AGENTS.md`: none found
- Backup: `/tmp/blackcrown-experience-backup-20260809-102023`
- Push, pull request, merge and deployment: not performed

## Environment And Baseline Gates

- Node: `v24.15.0`
- pnpm through Corepack: `9.15.4`
- Frozen install: passed; 128 packages were reused from the local store

| Command | Result | Evidence |
| --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | PASS | lockfile unchanged |
| `corepack pnpm --filter @blackcrown/site test:assets` | PASS | Crown `600x750`; EvoFish `800x500` |
| `corepack pnpm --filter @blackcrown/site typecheck` | PASS | no TypeScript diagnostics |
| `corepack pnpm --filter @blackcrown/site build` | PASS WITH WARNING | site entry exceeds 500 kB |
| `npm run build:prod` | PASS WITH EXISTING WARNINGS | site, protected game and lobby built; dist assembled |
| `git diff --check` | PASS | no whitespace errors |

The production build reports an existing protected-game asset warning for
`/game/assets/lobby/lobby-bg-station-16x9.png` and a protected-game JavaScript
chunk above 500 kB. Those warnings are outside the site cleanup scope and were
not hidden by changing Vite warning thresholds.

## Inventory

| Metric | Baseline |
| --- | ---: |
| Tracked files in requested audit scope | 268 |
| Tracked files under `apps/site` | 183 |
| Commerce API files | 4 |
| Auth API files | 2 |
| Package files inspected | 73 |
| Workflow files inspected | 5 |
| Build/audit scripts inspected | 1 |
| TS/TSX files under `apps/site/src` | 75 |
| CSS source files | 40 |
| Raw CSS bytes | 346,645 |
| `!important` occurrences | 1,549 |
| Duplicate selector names | 558 |
| Extra duplicate selector definitions | 1,176 |

The selector audit strips comments, normalizes selector whitespace and excludes
keyframe steps and at-rules. It measures historical cascade overlap rather than
claiming every repeated selector is independently wrong.

## Baseline Bundles

| Asset | Minified | Gzip | Initial |
| --- | ---: | ---: | --- |
| `dist/assets/index-By5h9emA.js` | 613.25 kB | 141.18 kB | yes |
| `dist/assets/index-BnEFGbgt.css` | 214.05 kB | 40.96 kB | yes |
| `dist/index.html` | 5.79 kB | 2.31 kB | yes |

- Initial route chunks: one JavaScript entry and one global CSS asset.
- Async route chunks: none.
- Vite warning: the single 613.25 kB entry exceeds 500 kB.
- Desktop creates 29 stylesheet objects.
- At `390x844`, `atomic-mobile-styles.ts` adds a thirtieth stylesheet with
  363,409 characters copied into the JavaScript bundle.
- No Nexus/Three dependency or async WebGL chunk exists in the baseline.

## Runtime Systems

Counts cover code reachable from `apps/site/src/main.tsx` before cleanup.

| Runtime primitive | Baseline |
| --- | ---: |
| `scroll` listener registrations | 6 |
| `resize` listener registrations | 10 |
| `pointermove` listener registrations | 4 |
| `orientationchange` registrations | 2 |
| `MutationObserver` systems | 5 |
| `IntersectionObserver` systems | 4 |
| Source files scheduling RAF | 7 |

RAF owners are `main.tsx`, `App.tsx`, `HeroParallaxDirector`,
`MobileParallaxDirector`, `MotionDirector`, `PremiumParallaxDirector` and
`CinematicExperience`. The current Home cinematic is the only runtime with a
live scene contract; the others are global or target historic selectors.

## Browser Baseline: Experience Mode Off

The baseline was served with `VITE_BC_EXPERIENCE_MODE=off` at
`http://127.0.0.1:5193/`.

| Viewport | DOM nodes | Nodes under `#root` | Scroll width | Client width | Scroll height | Stylesheets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `1440x900` | 364 | 300 | 1440 | 1440 | 9,121 | 29 |
| `390x844` | 330 | 265 | 390 | 390 | 8,545 | 30 |

- No horizontal overflow was observed in either first-frame capture.
- Crown and EvoFish images had non-zero natural dimensions and reported ready.
- Home reported cinematic phase zero on first frame.
- Desktop mounted Dock, SiteMusic, MatrixDepthEngine and all global directors.
- Mobile mounted Dock, SiteMusic, MobileParallaxDirector and remaining global
  directors.
- Baseline screenshots are outside Git:
  `/tmp/blackcrown-experience-screens/before-home-1440x900.png` and
  `/tmp/blackcrown-experience-screens/before-home-390x844.png`.

## Routes And Chrome

Site routes are `/`, `/about`, `/support`, `/privacy`, `/terms`, `/store`,
`/cart`, `/checkout`, `/checkout/success`, `/account` and `/admin`.

Protected routes `/game/**`, `/lobby/**` and `/games/**` bypass internal site
navigation. They are not cleanup targets.

Baseline defects:

- An unknown URL renders Home without replacing the incorrect address.
- All site pages are statically imported into the Home entry.
- Router owns Dock/Footer while App globally owns SiteMusic and motion layers.
- Commerce/admin overlays are sometimes mounted and hidden only by CSS.
- Several pages contain local copies of navigation helpers.

## Existing Behavior To Preserve

- `hero-crown.webp`: valid WebP, `600x750`, eager high-priority Hero key art,
  build-time and runtime health checks.
- `evofish-world.webp`: valid WebP, `800x500`, runtime health check.
- Current semantic CROWN//FRONT preview exists; approved final AAA art does not.
- Network/service SVG art and PWA icons exist.
- LiveFeedV3 contains a visible local fallback.
- Store writes to cart; quote and catalog prices are server-authoritative.
- Checkout is explicitly mock, persists KV orders and fulfilled entitlements.
- Order reads verify current-user ownership.
- Mobile overlay fixes prevent standard Dock/SiteMusic from blocking commerce.
- Current Home and current CinematicExperience are the required `off` baseline.

## Mode Contract Before Implementation

The target default is `VITE_BC_EXPERIENCE_MODE=off`. In that mode the current
Home remains active, `/nexus-lab` resolves to NotFound, no canvas is created and
no Nexus/Three chunk is requested. `lab` enables only `/nexus-lab`; `home` also
allows the isolated experience shell on `/`. No production environment is
changed by this local branch.

## V4 Result

The implementation was completed in the isolated worktree without changing the
original checkout. The local `.env.local` enables `lab` only for this worktree,
is ignored by Git and is not staged. Missing environment values still resolve
to `off` in source.

### Foundation Before And After

| Metric | Before | After |
| --- | ---: | ---: |
| Site CSS source files | 40 | 22 |
| Raw site CSS bytes | 346,645 | 120,803 |
| `!important` occurrences | 1,549 | 307 |
| Duplicate selector names | 558 | 206 |
| Extra duplicate definitions | 1,176 | 391 |
| Initial JavaScript | 613.25 kB | 195.80 kB |
| Initial CSS | 214.05 kB | 48.89 kB |
| Desktop Home DOM nodes | 364 | 315 |
| Mobile Home DOM nodes | 330 | 315 |
| Desktop stylesheet objects | 29 | 20 |
| Mobile stylesheet objects | 30 | 20 |

The after selector audit uses the same comment stripping, selector whitespace
normalization and keyframe/at-rule exclusion described above. The full mobile
stylesheet is no longer imported through `?inline`; no source module contains a
CSS inline import or raster key-art data URI.

### Final Bundle Graph

The final `lab` build emits the following measured chunks:

| Asset | Minified | Gzip | Loading |
| --- | ---: | ---: | --- |
| Site entry | 195.80 kB | 62.60 kB | initial |
| Site entry CSS | 48.89 kB | 10.91 kB | initial |
| Nexus route | 10.41 kB | 3.75 kB | route lazy |
| Experience runtime | 22.07 kB | 7.31 kB | nested lazy |
| Three.js | 478.94 kB | 120.65 kB | nested lazy |
| Account | 19.28 kB | 6.11 kB | route lazy |
| Admin | 22.88 kB | 5.59 kB | route lazy |

About, Support, Privacy, Terms, Store, Cart, Checkout and CheckoutSuccess also
emit independent route chunks. An automated off-mode request audit confirms
that `/` requests neither the Nexus route/runtime nor Three.js and creates no
canvas. The budget gate reports 191.21 KiB initial JavaScript, 47.74 KiB
initial CSS, 21.56 KiB ExperienceRuntime and 467.71 KiB Three.js.

### Runtime Ownership After Cleanup

- Normal Home owns one scroll listener and one RAF scheduler in the preserved
  `CinematicExperience`.
- App owns only the shared viewport synchronization RAF plus resize,
  orientation and VisualViewport listeners.
- Nexus is route-scoped and adds one scroll director, one pointer controller
  and one renderer RAF only while `/nexus-lab` or local `home` mode is active.
- Source contains no MutationObserver or IntersectionObserver system.
- The complete source graph contains two scroll, five resize/VisualViewport,
  one pointer and one orientation listener registration; the two routes never
  mount both cinematic runtimes together.
- Route leave/re-entry testing proves zero canvas/runtime after disposal and one
  clean canvas/runtime after re-entry.

### Browser Proof

| Surface | Viewport | DOM | Root | Scroll/client width | Height | Sheets |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| Home off | `1440x900` | 315 | 259 | `1440/1440` | 9,446 | 20 |
| Home off | `390x844` | 315 | 259 | `390/390` | 8,730 | 20 |
| Nexus lab | `1440x900` | 170 | 113 | `1440/1440` | 6,300 | 21 |
| Nexus lab | `390x844` | 170 | 113 | `390/390` | 4,425 | 21 |

Home key art remained healthy at `600x750` and `800x500`; mobile and desktop
had no horizontal overflow. The four required Nexus mobile sizes passed CTA
center hit-testing, including `844x390`. Screenshots remain outside Git under
`/tmp/blackcrown-experience-screens/`.

### Nexus Runtime Measurements

Measurements were taken at `1440x900` with separate fresh low, medium and high
runtime initialization so geometry budgets were not inherited from another
tier.

| Tier | Draw calls | Triangles | Observed FPS | Frame time | Renderer |
| --- | ---: | ---: | ---: | ---: | --- |
| low | 50 | 6,604 | 120.0 | 8.6 ms | WebGL2 |
| medium | 54 | 10,248 | 119.9 | 9.5 ms | WebGL2 |
| high | 58 | 14,256 | 119.7 | 8.3 ms | WebGL2 |

These are local automated-browser observations, not physical-device profiling.
DPR caps are 1.0, 1.25 and 1.5. Compact landscape, coarse pointers, save-data,
reduced motion and constrained hardware select the low path.

### Final Validation Evidence

- Key-art validator: PASS for nine canonical/semantic/PWA assets.
- Site typecheck: PASS.
- Vitest: 18/18 PASS.
- Playwright: 16/16 PASS across Chromium and WebKit.
- Lab site build and bundle budget: PASS with no site chunk warning.
- `npm run build:prod`: PASS; the pre-existing protected-game missing runtime
  asset and 625.98 kB game chunk warnings remain visible.
- `git diff --check`: PASS.
