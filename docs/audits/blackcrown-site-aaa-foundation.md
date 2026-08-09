# BlackCrown AAA Foundation Audit

This report records reachability and ownership before cleanup. A file is marked
for deletion only when its import graph, repository-wide references, runtime
selectors, package exports and API dependencies are all understood. Final build
and typecheck are additional deletion proof.

## Scope And Graph Summary

- Entry: `apps/site/src/main.tsx` -> `App.tsx` -> `routes/Router.tsx`.
- Baseline runtime graph: 75 reachable source/style files.
- Baseline unreachable source graph: 40 files, excluding public assets.
- Router graph: all eleven site pages are static imports of `routes/Router.tsx`.
- CSS graph: 29 normal stylesheet imports plus a mobile-only JavaScript string
  containing 34 concatenated stylesheets.
- API graph: client cart -> `/api/commerce/quote` -> `/api/commerce/checkout` ->
  KV order/entitlements -> `/api/commerce/orders/:id`.
- Catalog graph: client `lib/store.ts` and server `_lib/commerce.ts` contain two
  manually synchronized catalog/price tables.
- Chrome graph: Router owns Dock/Footer, while App owns Music globally.
- Protected app graph: `/game/**`, `/lobby/**`, `/games/**` bypass site routing.

## Controller Evidence

| Controller | Route scope | Selectors/contract | Runtime cost | Classification | Decision |
| --- | --- | --- | --- | --- | --- |
| root motion in `main.tsx` | all routes | `--bc-cx*`, `--bc-scroll-*` | pointer, scroll, resize, orientation, viewport, RAF | LEGACY_CANDIDATE | remove after consumer proof |
| `HeroParallaxDirector` | all routes | `.bcHeroConcept*` absent from HomeV3 | MutationObserver, scroll, resize, pointer, RAF | DELETE | remove |
| `MobileParallaxDirector` | all mobile routes | old `.bcV3Hero`, `.bcWorldStageV2`, transitions and `data-bc-parallax` | MutationObserver, IntersectionObserver, scroll, resize, viewport, RAF | DELETE | remove |
| `PremiumParallaxDirector` | all desktop routes | old `data-bc-parallax`, world transition selectors | MutationObserver, scroll, resize, pointer, viewport, RAF | DELETE | remove |
| `MotionDirector` | all routes | historic cards/buttons plus global style inspection | MutationObserver, IntersectionObserver, pointer, scroll, resize, RAF | LEGACY_CANDIDATE | replace only if explicit reveal remains necessary |
| `MotionRevealV3` | all routes | mixed old scenes and live services | MutationObserver, two IntersectionObservers | PARTIAL | replace with explicit feature reveal or remove |
| `MatrixDepthEngine` | all desktop routes | decorative fixed DOM, no route contract | 10+ decorative nodes and media listeners | LEGACY_CANDIDATE | remove global mount; keep only if Home evidence justifies it |
| `CinematicExperience` | Home | current `.bcCinematicExperience` | scroll, resize, RAF | ACTIVE | replace with authoritative V2 timeline |
| `App` viewport writer | all routes | `--app-vh` | resize, orientation, viewport, RAF | PARTIAL | consolidate into one viewport contract |

## Component Reachability

| Path/group | Imported by | Runtime selectors/API | Classification | Decision | Evidence |
| --- | --- | --- | --- | --- | --- |
| `AICoachV3.tsx` | `HomeV3` | `.bcAICoachV3` | ACTIVE | keep | visible Home service |
| `CinematicExperience.tsx` | `HomeV3` | `.bcCinematicExperience` | ACTIVE | rewrite/move | current Home hero and key-art health check |
| `CommerceHeader.tsx` | Store/Cart/Checkout/Success | commerce chrome | PARTIAL | keep | route consumers |
| `DockV2.tsx` | Router | `.bcDockV2` | ACTIVE | keep/re-style | route chrome |
| `GlassSurface.tsx` | Home services | `.bcGlassSurface` | ACTIVE | keep | current service shells |
| `LiveFeedV3.tsx` | `HomeV3` | content API + fallback | ACTIVE | keep | fallback verified in source |
| `SiteFooter.tsx` | Router | `.bcFooter` | ACTIVE | keep | route chrome |
| `SiteHeader.tsx` | About/Account | `.bcTop` | PARTIAL | keep | lazy route consumer |
| `SiteMusic.tsx` | App | `.bcSiteMusic` | ACTIVE | move to route metadata | global overlay today |
| `StoreV3.tsx` | `HomeV3` | `.bcStoreV3` | ACTIVE | keep | Home service preview |
| `siteIcons.ts` | Dock | static icon map | ACTIVE | keep | current chrome asset dependency |
| `HeroParallaxDirector.tsx` | App | absent legacy Hero selectors | LEGACY_CANDIDATE | delete | no current DOM consumer |
| `MobileParallaxDirector.tsx` | App | absent legacy scene selectors | LEGACY_CANDIDATE | delete | no current cinematic consumer |
| `PremiumParallaxDirector.tsx` | App | absent legacy parallax nodes | LEGACY_CANDIDATE | delete | no current cinematic consumer |
| `MotionDirector.tsx` | App | mixed old global selectors | LEGACY_CANDIDATE | delete/replace | overlapping reveal and pointer runtime |
| `MotionRevealV3.tsx` | App | mixed current/legacy selectors | PARTIAL | replace or delete | overlaps MotionDirector |
| `MatrixDepthEngine.tsx` | App | global decoration | LEGACY_CANDIDATE | delete global layer | duplicated cinematic grain/grid/fog |
| `BrandCore`, `DigitalCrownCore` | none | legacy inline SVG systems | DELETE | delete after repo proof | unreachable from main |
| `HeroScene`, `WorldStageV2`, `PlatformV3` | none | old Hero/world/platform DOM | DELETE | delete after repo proof | unreachable from main |
| `CinematicWorldTransition`, `ReactorFX` | none | old transition/world DOM | DELETE | delete after repo proof | unreachable from main |
| `PremiumShell`, `MobileDock`, `RouteMotion` | none | obsolete shell/chrome | DELETE | delete after repo proof | superseded and unreachable |
| `ContentBlocks`, `ContentSection` | none | legacy content API | DELETE | delete after repo proof | unreachable pair |
| `AppErrorBoundary.tsx`, `crashHooks.ts` | none | duplicate error infrastructure | DELETE | delete after repo proof | active entry uses `ErrorBoundary.tsx` and inline hooks |
| `features/account`, `features/content`, `features/store` | none | legacy modal/content preview | DELETE | delete after repo proof | no package export or runtime import |
| root `router.tsx`, legacy `routes/*.tsx` | none from main | obsolete router/pages | DELETE | delete after repo proof | active router is `routes/Router.tsx` |
| `routes/pages/_Layout.tsx` | none | obsolete page wrapper | DELETE | delete after repo proof | current pages own layout |
| `types/blackcrown-ui.d.ts` | TypeScript include | ambient types | KEEP_TEMPORARILY | keep | compile-time, not runtime reachability |

## Stylesheet Reachability

| Path | Imported by | Active selector owner | Classification | Decision | Evidence |
| --- | --- | --- | --- | --- | --- |
| `app.css` | main + atomic | root/app shell | ACTIVE | reduce into base/shell | entry dependency |
| `site.css` | main + atomic | shared page primitives | ACTIVE | keep then split | current route pages |
| `premium-shell.css` | main + atomic | shell/header/footer | PARTIAL | migrate | current chrome mixed with legacy |
| `visual-overhaul.css` | main + atomic | shared/legal/account plus old layers | PARTIAL | split route styles | 32 kB global historical layer |
| `experience-layer.css` | main + atomic | mixed effects | LEGACY_CANDIDATE | migrate live rules/delete | historical overrides |
| `stability-fixes.css` | main + atomic | global patches | LEGACY_CANDIDATE | fold proven fixes into owners | patch layer |
| `matrix-rebirth.css` | main + atomic | historic matrix theme | LEGACY_CANDIDATE | delete after selector proof | superseded visual layer |
| `customer-stability.css` | main + atomic | imports brand nexus + patches | LEGACY_CANDIDATE | migrate proven fixes | duplicates full brand stylesheet |
| `brand-nexus.css` | main + atomic + CSS import | current and old nexus selectors | PARTIAL | split by owner | 34 kB global historical layer |
| `v3-mobile-art-pass.css` | main + atomic | old V3 scene mobile overrides | LEGACY_CANDIDATE | delete/migrate | old scene DOM absent |
| `dock-v2.css` | main + atomic | DockV2 | ACTIVE | rewrite as chrome owner | direct DOM consumer |
| `home-v3.css` | main + atomic | mixed Home generations | PARTIAL | replace with Home owners | old scene selectors dominate |
| `cinematic-experience-v1.css` | current cinematic + atomic | cinematic V1 | ACTIVE | replace with `cinematic.css` | current DOM consumer |
| `services-v3.css` | HomeV3 + atomic | Home services | ACTIVE | keep/merge | current DOM consumers |
| `home-v3-services.css` | HomeV3 + atomic | service composition | ACTIVE | merge into services owner | current DOM consumers |
| `v3-4-services-visual.css` | HomeV3 + atomic | service visuals | ACTIVE | merge into services owner | current DOM consumers |
| `store-v3.css` | StoreV3 + atomic | Home store preview | ACTIVE | keep as feature owner | current DOM consumer |
| `live-feed-v3.css` | LiveFeedV3 + atomic | Home live feed | ACTIVE | keep as feature owner | current DOM consumer/fallback |
| `glass-system.css` | GlassSurface + atomic | service surfaces | ACTIVE | keep/reduce | current component owner |
| `site-music.css` | SiteMusic + atomic | music overlay | ACTIVE | rewrite against safe-area contract | current component owner |
| `commerce.css` | commerce routes + atomic | Store/Cart/Checkout | PARTIAL | keep route scoped | current route consumers |
| `mobile-overlay-fixes.css` | atomic only | Dock/Music/commerce overlap fixes | ACTIVE | preserve as normal overlay owner | required baseline fix currently delivered through atomic |
| `mobile-scroll-stability.css` | App + atomic | Safari and old parallax mitigation | PARTIAL | extract viewport fixes | contains live mobile safeguards and obsolete runtime rules |
| `motion-reveal-v3.css` | MotionReveal + atomic | mixed reveal generations | PARTIAL | remove with runtime or replace explicit reveal | controller owner |
| `premium-parallax.css` | Premium director + atomic | old parallax vars | LEGACY_CANDIDATE | delete | absent current target contract |
| `matrix-depth-engine.css` | MatrixDepthEngine | global decoration | LEGACY_CANDIDATE | delete with component | duplicated cinematic effects |
| `hero-premium-v1.css` | atomic only | obsolete Hero | DELETE | delete after atomic removal | no current DOM/import consumer |
| `hero-concept-v2.css` | unreachable HeroScene + atomic | obsolete Hero | DELETE | delete | no current DOM consumer |
| `aaa-experience-v1.css` | unreachable HeroScene + atomic | obsolete Hero/world | DELETE | delete | no current DOM consumer |
| `aaa-art-v2.css` | unreachable HeroScene + atomic | obsolete Hero/world | DELETE | delete | no current DOM consumer |
| `world-stage-v2.css` | unreachable WorldStage + atomic | obsolete world | DELETE | delete | no current DOM consumer |
| `v3-4-world-visual.css` | unreachable WorldStage + atomic | obsolete world | DELETE | delete | no current DOM consumer |
| `cinematic-world-transition.css` | unreachable transition + atomic | obsolete transition | DELETE | delete | no current DOM consumer |
| `reactor-fx.css` | unreachable ReactorFX + atomic | obsolete reactor | DELETE | delete | no current DOM consumer |
| `critical-mobile-shell.css` | atomic only | emergency mobile shell | DELETE | delete after extracting any true boot invariant | full inline delivery only |
| `black-neon-core.css`, `black-neon-pages.css` | none | obsolete theme | DELETE | delete | unreachable from main and packages |
| `design-tokens.css` | none | obsolete local tokens | UNCERTAIN | keep until token consolidation | no runtime import but possible design reference |
| `matrix.css` | none | obsolete matrix theme | DELETE | delete | unreachable |
| `v3-1-visual-impact.css` | none | obsolete V3 art pass | DELETE | delete | unreachable |

## Commerce Reachability

| Path | Classification | Decision |
| --- | --- | --- |
| `apps/site/src/lib/commerce.ts` | ACTIVE | preserve cart/quote/order flow; add entitlements/idempotency client |
| `apps/site/src/lib/store.ts` | ACTIVE | retain catalog UI/wishlist compatibility; remove authoritative local economy writes |
| `functions/api/_lib/commerce.ts` | ACTIVE | preserve validation; consume shared catalog |
| `functions/api/commerce/quote.ts` | ACTIVE | preserve server quote |
| `functions/api/commerce/checkout.ts` | ACTIVE | preserve mock label/KV flow; add user-scoped idempotency |
| `functions/api/commerce/orders/[id].ts` | ACTIVE | preserve ownership check |
| `functions/api/auth/guest.ts`, `_lib/auth.ts` | ACTIVE | preserve cookie identity; no auth redesign |
| `GET /api/commerce/entitlements` | MISSING | add current-user, no-store endpoint |

## Static Assets

- Canonical current raster key art: `public/art/hero-crown.webp` and
  `public/art/evofish-world.webp`.
- Current semantic CROWN//FRONT preview:
  `public/assets/games/crown-front/crown-front-preview.svg`.
- Current service SVGs: coach, EvoFish, lobby, network and store under
  `public/assets/site/neon`.
- PWA PNG/SVG icon variants are present.
- No dedicated OpenGraph raster was found.
- `public/games/crown-front/**` is PROTECTED; it is inventoried but excluded from
  cleanup and asset migration.

## Intentionally Kept Until Proof

- LiveFeedV3 and its fallback behavior.
- Key-art runtime natural-dimension check.
- Existing WebP binaries and protected CROWN//FRONT runtime.
- Commerce quote, mock checkout, KV orders, entitlement writes and order
  ownership checks.
- Mobile overlay behavior, migrated to a normal CSS asset rather than removed.
- `design-tokens.css` is UNCERTAIN at audit time and will not be deleted without
  a token ownership decision.

