# BlackCrown Site Reachability And Ownership

This report records import, selector, asset and API reachability before deletion.
`DELETE` is assigned only where static imports, dynamic imports, string
references, selector consumers, package exports and asset references are absent.
Typecheck, build and an `off`-mode visual comparison remain required after each
deletion phase.

## Graph Summary

- Runtime entry: `main.tsx` -> `App.tsx` -> `routes/Router.tsx`.
- Source/style graph: 77 runtime-reachable and 38 runtime-unreachable files.
- Router graph: eleven page modules are static imports.
- CSS graph: normal assets plus 34 `?inline` imports in
  `atomic-mobile-styles.ts`.
- Commerce graph: cart -> quote -> checkout -> KV order/entitlements -> order.
- Catalog graph: client `lib/store.ts` and server `_lib/commerce.ts` duplicate
  product and price data.
- Chrome graph: Router owns Dock/Footer; App owns global SiteMusic and motion.

## Runtime Controllers

| Path | Classification | Imported by | Selectors/API | Runtime effect | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| root motion block in `main.tsx` | LEGACY_CANDIDATE | entry | `--bc-cx*`, `--bc-scroll-*` | pointer, scroll, resize, orientation, viewport, RAF | remove after variable-consumer proof | overlaps current cinematic and historic directors |
| `components/HeroParallaxDirector.tsx` | DELETE | App | `.bcHeroConcept*` | MutationObserver, scroll, resize, pointer, RAF | delete | current Home does not create target DOM |
| `components/MobileParallaxDirector.tsx` | DELETE | App mobile | `.bcV3Hero`, `.bcWorldStageV2`, transitions | MutationObserver, IntersectionObserver, scroll, resize, viewport, RAF | delete | target scene generations absent |
| `components/PremiumParallaxDirector.tsx` | DELETE | App desktop | legacy parallax/transition nodes | MutationObserver, scroll, resize, pointer, viewport, RAF | delete | no current cinematic target contract |
| `components/MotionDirector.tsx` | LEGACY_CANDIDATE | App | old cards/buttons and inline style inspection | document MutationObserver, IntersectionObserver, pointer, scroll, resize, RAF | delete/replace | overlaps reveal runtime and inspects whole document |
| `components/MotionRevealV3.tsx` | PARTIAL | App | mixed old scenes and live services | MutationObserver and two IntersectionObservers | replace only if explicit reveal is needed | current selectors are a subset of broad legacy contract |
| `components/MatrixDepthEngine.tsx` | LEGACY_CANDIDATE | App desktop | fixed decorative DOM | media listeners and decorative nodes | remove global mount | duplicates cinematic grain/grid/fog |
| `components/CinematicExperience.tsx` | ACTIVE | HomeV3 | `.bcCinematicExperience` | scroll, resize, RAF | preserve as `off` Home authority | current key art and current scene contract |
| viewport writer in `App.tsx` | PARTIAL | App | `--app-vh` | RAF, resize, orientation, VisualViewport | keep and simplify | active Safari layout invariant |

## Active And Partial Components

| Path/group | Classification | Imported by | Selectors/API | Runtime effect | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `App.tsx`, `main.tsx`, `ErrorBoundary.tsx` | ACTIVE | entry | app shell/bootstrap | root lifecycle | rewrite only for runtime cleanup | entry graph |
| `routes/Router.tsx`, `routes/HomeV3.tsx` | ACTIVE | App/router | route state/Home | routing and Home | preserve behavior; add metadata/lazy routes | entry graph |
| `AICoachV3.tsx` | ACTIVE | HomeV3 | `.bcAICoachV3` | service content | keep | visible Home section |
| `CinematicExperience.tsx` | ACTIVE | HomeV3 | `.bcCinematicExperience` | current Home timeline | keep unchanged in off mode | visible Home/key art |
| `GlassSurface.tsx` | ACTIVE | Home services | `.bcGlassSurface` | presentational | keep | live consumers |
| `LiveFeedV3.tsx` | ACTIVE | HomeV3 | content API/fallback | fetch and fallback | keep | required working fallback |
| `StoreV3.tsx` | ACTIVE | HomeV3 | local catalog/cart | service preview | keep; migrate ownership source | visible Home section |
| `DockV2.tsx`, `SiteFooter.tsx` | ACTIVE | Router | route chrome | navigation | keep; control with metadata | visible routes |
| `SiteMusic.tsx` | ACTIVE | App | `.bcSiteMusic` | audio overlay | keep for normal routes; omit in Nexus metadata | required route-specific behavior |
| `CommerceHeader.tsx` | PARTIAL | commerce pages | commerce nav | route chrome | keep | current Store/Cart/Checkout consumers |
| `SiteHeader.tsx` | PARTIAL | About/Account | top nav | route chrome | keep | current page consumers |
| `siteIcons.ts` | ACTIVE | Dock | icon map | static render | keep | direct import |
| `routes/pages/**` current pages | PARTIAL | Router | page-specific APIs | per-route UI | lazy-load | direct route imports |
| `lib/commerce.ts` | ACTIVE | commerce pages | commerce endpoints | cart/order client | preserve and extend | current flow |
| `lib/store.ts` | ACTIVE | Store/Account/Home | catalog/wishlist/local owned | local state | retain presentation/wishlist; remove authority | current consumers |
| `lib/navigation.ts` | ACTIVE | current pages | History API | route navigation | central typed helper target | direct imports |
| `lib/contentClient.ts`, `lib/audio.ts`, `lib/storage.ts` | ACTIVE/PARTIAL | Home/chrome | fetch/audio/storage | feature-scoped | keep | current imports |

## Proven Unreachable Components

The following have no import from the entry graph, no dynamic import, no package
export consumer and no active runtime string reference. Their paired styles are
listed separately.

| Path/group | Classification | Imported by | Selectors/API | Runtime effect | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `components/AppErrorBoundary.tsx`, `crashHooks.ts` | DELETE | none | duplicate error hooks | none reachable | delete | active entry uses `ErrorBoundary.tsx` |
| `components/BrandCore.tsx`, `DigitalCrownCore.tsx` | DELETE | none | legacy SVG crown/core | none reachable | delete | no entry/package/string consumer |
| `components/HeroScene.tsx`, `WorldStageV2.tsx`, `PlatformV3.tsx` | DELETE | none | historic Hero/world/platform DOM | none reachable | delete | no entry consumer |
| `components/CinematicWorldTransition.tsx`, `ReactorFX.tsx` | DELETE | none | historic transition/reactor DOM | none reachable | delete | no entry consumer |
| `components/PremiumShell.tsx`, `MobileDock.tsx`, `RouteMotion.tsx` | DELETE | none | obsolete shell/chrome | none reachable | delete | superseded and unreachable |
| `components/ContentBlocks.tsx`, `ContentSection.tsx` | DELETE | none | old content API | none reachable | delete | unreachable pair |
| `features/account/**`, `features/content/**`, `features/store/**` | DELETE | none | old modals/previews | none reachable | delete | no package export or route consumer |
| root `router.tsx`, legacy `routes/App.tsx`, `Home.tsx`, `HomeBlocks.tsx` | DELETE | none | old router/Home | none reachable | delete | active router is `routes/Router.tsx` |
| old `routes/About.tsx`, `Support.tsx`, `Privacy.tsx`, `Terms.tsx` | DELETE | none | old page generation | none reachable | delete | current pages live under `routes/pages` |
| `routes/pages/_Layout.tsx` | DELETE | none | old page wrapper | none reachable | delete | current pages own layout |
| `assets/blackcrownHeroCrown.ts` | DELETE | none | old asset module | none reachable | delete | canonical current WebP is public asset |
| `lib/content.ts`, `contentApi.ts`, `guest.ts`, `useMe.ts`, `xpClient.ts` | DELETE | none | superseded APIs | none reachable | delete | no runtime/package consumers |
| `pwa.ts` | DELETE | none | unused registration helper | none reachable | delete | no entry import |
| `types/blackcrown-ui.d.ts` | KEEP_TEMPORARILY | TypeScript include | ambient declarations | compile-time only | keep | runtime reachability does not prove type irrelevance |

## Stylesheet Ownership

| Path | Classification | Imported by | Selector owner | Runtime effect | Decision | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `app.css`, `site.css` | ACTIVE | main + atomic | root/shared pages | global base/layout | consolidate into base/layout | entry imports |
| `premium-shell.css` | PARTIAL | main + atomic | chrome and old shell | mixed global rules | migrate live rules | current chrome plus legacy selectors |
| `visual-overhaul.css` | PARTIAL | main + atomic | legal/account and old layers | 32 kB global cascade | split by route/owner | current and absent selectors mixed |
| `experience-layer.css` | LEGACY_CANDIDATE | main + atomic | historical effects | override layer | migrate live rules then delete | selector overlap |
| `stability-fixes.css` | LEGACY_CANDIDATE | main + atomic | global patches | final cascade patch | fold proven fixes into owners | patch ownership is non-local |
| `matrix-rebirth.css` | LEGACY_CANDIDATE | main + atomic | historic matrix theme | global theme layer | delete after selector proof | superseded scene generation |
| `customer-stability.css` | LEGACY_CANDIDATE | main + atomic | brand import plus patches | duplicate/patched cascade | migrate proven fixes | imports another full historical layer |
| `brand-nexus.css` | PARTIAL | main, CSS import, atomic | current and old Nexus-named selectors | 34 kB global layer | split by actual owners | mixed current/absent selector map |
| `v3-mobile-art-pass.css` | LEGACY_CANDIDATE | main + atomic | old V3 scene | mobile overrides | delete/migrate | old scene DOM absent |
| `dock-v2.css` | ACTIVE | main + atomic | DockV2 | chrome | retain as chrome owner | direct DOM consumer |
| `home-v3.css` | PARTIAL | main + atomic | several Home generations | mixed Home cascade | replace with current Home owners | old scene selectors dominate |
| `cinematic-experience-v1.css` | ACTIVE | current Cinematic + atomic | current cinematic | current Home visuals | preserve for off-mode regression | direct current consumer |
| `services-v3.css`, `home-v3-services.css`, `v3-4-services-visual.css` | ACTIVE | Home + atomic | current Home services | three overlapping service layers | merge into route-scoped services | current DOM consumers |
| `store-v3.css`, `live-feed-v3.css`, `glass-system.css` | ACTIVE | owning components + atomic | Home feature components | feature visuals | keep or consolidate by owner | direct component imports |
| `site-music.css` | ACTIVE | SiteMusic + atomic | music overlay | audio control geometry | retain under chrome owner | direct component import |
| `commerce.css` | PARTIAL | commerce pages + atomic | Store/Cart/Checkout | route UI | retain route-scoped | direct route imports |
| `mobile-overlay-fixes.css` | ACTIVE | atomic only | Dock/Music/commerce | required mobile overlap fixes | preserve as normal CSS asset | required baseline behavior |
| `mobile-scroll-stability.css` | PARTIAL | App + atomic | Safari plus old parallax | viewport/mobile patches | extract active viewport fixes | live and obsolete rules mixed |
| `motion-reveal-v3.css` | PARTIAL | MotionReveal + atomic | mixed reveals | animation/reveal | remove with broad runtime or replace explicitly | controller owner |
| `premium-parallax.css` | DELETE | dead director + atomic | absent parallax targets | variables/transforms | delete | no current target contract |
| `matrix-depth-engine.css` | DELETE | MatrixDepthEngine | global decoration | fixed effects | delete with global component | no route-specific ownership |
| `hero-premium-v1.css`, `hero-concept-v2.css` | DELETE | atomic/dead Hero | obsolete Hero DOM | historic scene | delete | no current selector consumer |
| `aaa-experience-v1.css`, `aaa-art-v2.css` | DELETE | atomic/dead Hero | obsolete Hero/world | historic scene | delete | no current selector consumer |
| `world-stage-v2.css`, `v3-4-world-visual.css` | DELETE | atomic/dead world | obsolete world DOM | historic scene | delete | no current selector consumer |
| `cinematic-world-transition.css`, `reactor-fx.css` | DELETE | atomic/dead components | obsolete transitions | historic scene | delete | no current selector consumer |
| `critical-mobile-shell.css` | DELETE | atomic only | emergency old shell | inline patch | delete after active invariants migrate | no direct owner outside duplicate delivery |
| `black-neon-core.css`, `black-neon-pages.css` | DELETE | none | old theme | none reachable | delete | no import/string/package consumer |
| `matrix.css`, `v3-1-visual-impact.css` | DELETE | none | old visual generations | none reachable | delete | no import/string/package consumer |
| `design-tokens.css` | KEEP_TEMPORARILY | none | historic token reference | no runtime effect | keep until token consolidation decision | absence alone is insufficient proof of design ownership |

## Commerce And API Ownership

| Path/API | Classification | Decision | Evidence |
| --- | --- | --- | --- |
| `apps/site/src/lib/commerce.ts` | ACTIVE | preserve cart/quote/order flow; add entitlements/idempotency | current pages import it |
| `apps/site/src/lib/store.ts` | ACTIVE | retain catalog presentation/wishlist; remove purchase authority | Store/Home/Account import it |
| `functions/api/_lib/commerce.ts` | ACTIVE | preserve validation; consume shared catalog | quote/checkout import it |
| `functions/api/commerce/quote.ts` | ACTIVE | preserve server quote | client endpoint reference |
| `functions/api/commerce/checkout.ts` | ACTIVE | preserve mock/KV flow; add bounded user-scoped idempotency | client endpoint reference |
| `functions/api/commerce/orders/[id].ts` | ACTIVE | preserve ownership check | success page endpoint reference |
| `functions/api/auth/guest.ts`, `_lib/auth.ts` | ACTIVE | preserve cookie identity; no auth redesign | app bootstrap and commerce |
| `GET /api/commerce/entitlements` | MISSING | add no-store current-user endpoint | local owned and KV entitlements can diverge |

Duplicate catalog evidence: client `STORE_ITEMS` and server `PRODUCTS` both
encode item IDs and prices by hand. Duplicate navigation evidence: route pages
contain local History API helper variants despite an existing navigation module.

## Significant Assets

| Asset/group | Classification | Consumer | Decision | Evidence |
| --- | --- | --- | --- | --- |
| `public/art/hero-crown.webp` | ACTIVE | current cinematic Hero | preserve | valid `600x750`, preload/runtime validation |
| `public/art/evofish-world.webp` | ACTIVE | current cinematic EvoFish | preserve; later content need not be eager | valid `800x500`, runtime validation |
| `public/assets/games/crown-front/crown-front-preview.svg` | ACTIVE | current cinematic | preserve as semantic preview | final approved art absent |
| `public/assets/site/neon/**` | ACTIVE/PARTIAL | Home services/network | preserve referenced files | direct JSX/CSS references |
| `public/pwa/icons/**` | PARTIAL | manifest/PWA | preserve | external browser/manifest consumer |
| dedicated OpenGraph raster | MISSING | document metadata | record limitation | no canonical file found |
| `public/games/crown-front/**` | PROTECTED | external game route | do not change | explicitly outside V4 scope |
| `apps/game/**`, `apps/lobby/**`, `apps/ws-lobby/**`, `unity/**` | PROTECTED | external applications | do not change | explicitly outside V4 scope |

## Required Post-Deletion Proof

For each `DELETE` group, the cleanup commit must retain zero static, dynamic,
string, selector, asset and package-export consumers. `typecheck`, site build and
an `off`-mode browser comparison must pass. Required active exceptions are the
current Home cinematic, key-art health, LiveFeed fallback, server commerce flow,
mobile overlay behavior and protected external routes.

