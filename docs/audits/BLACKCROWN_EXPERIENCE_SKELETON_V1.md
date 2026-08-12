# BLACKCROWN Experience Skeleton V1 Audit

## Baseline

- Source branch: `feature/blackcrown-production-crown-candidate-b-local-v1`
- Source commit: `5b506bac25210de3e4a8b50a63913f54c55628c7`
- Skeleton branch: `feature/blackcrown-experience-skeleton-v2-local`
- Worktree before changes: clean
- Backup: `/tmp/blackcrown-experience-skeleton-backup-20260809-205744/`
- Production experience mode: `off`
- Canonical Crown manifest: disabled
- Candidate A and Candidate B: local lab/debug only

## Baseline Validation

| Check | Result |
| --- | --- |
| Key-art validator | PASS, 9 assets |
| Crown validator | PASS, canonical manifest disabled |
| Site typecheck | PASS |
| Unit tests | PASS, 40/40 |
| Mode-off build | PASS |
| Initial entry JS | 191.94 kB minified |
| Initial CSS | 48.89 kB minified |
| Existing Nexus route chunk | 17.65 kB minified |
| Existing runtime chunk | 61.86 kB minified |
| Three core / renderer | 214.99 / 357.34 kB, lazy |

## Existing Runtime Ownership

The existing Nexus route already owns exactly one `ExperienceRuntime`, `WebGLRenderer`,
`PerspectiveCamera`, `ScrollDirector`, `PointerParallax`, `QualityManager` and RAF scheduler.
`ExperienceRuntime.dispose()` aborts pending Crown loads and disposes the Crown adapter,
particles, architecture, ecosystem, portal, scene root, renderer, input and audio.

The shell must extend this runtime. A second renderer, scroll listener, RAF or route-global
WebGL provider is not permitted.

## Current Reachability

| Surface | Status | Evidence / decision |
| --- | --- | --- |
| `ExperienceRuntime` | ACTIVE | Lazily imported by `BlackCrownExperience` on the Nexus route |
| `ScrollDirector` | ACTIVE | Sole native-scroll timeline source |
| Crown procedural/GLB adapters | ACTIVE | Runtime-selected backend with controlled fallback |
| Candidate A/B manifests | PARTIAL | Explicit local debug override only; preserve unchanged |
| `ParticleField`, `NexusArchitecture`, `PortalField` | ACTIVE | Crown-centric shared scene layers; migrate behind registry |
| `EcosystemNodes` | ACTIVE | Current final-chapter nodes; replace with Network scene ownership |
| `ScrollStory` | ACTIVE | Seven Crown-centric semantic chapters; replace with eight shell chapters |
| `NexusHUD` | ACTIVE | Route-scoped chrome; refactor into accessible shell chrome/menu |
| Store, Account and commerce routes | ACTIVE | Remain ordinary site routes and authoritative commerce surfaces |
| Global dock/music | INACTIVE ON LAB | Route metadata already disables them; preserve |

## Confirmed Skeleton Gaps

1. The current seven chapters describe one Crown demonstration, not an entire spatial site.
2. Scene objects are directly owned by `ExperienceRuntime`; there is no scene registry,
   transition owner or semantic asset-slot registry.
3. Camera keyframes and Crown choreography are continuous, but there are no distinct world
   environments for EvoFish, CROWN//FRONT, Network, Collection and Identity.
4. Hash anchors target old chapter IDs and do not provide a spatial-router history contract.
5. DOM copy is duplicated between chapter definitions and action branches.
6. Scene activation is not budgeted as one active scene plus one transition partner.
7. The current mobile story is 490svh and desktop story is 700svh; the requested shell needs
   config-driven 600-760svh mobile and 900-1200svh desktop.

## Implemented Architecture

- `BlackCrownExperienceShell` owns a semantic eight-chapter DOM spine while the existing
  `ExperienceRuntime` remains the sole renderer, camera, RAF and scroll owner.
- `SceneRegistry` creates each scene root once per route session. `SceneLifecycle` permits
  one fully active scene and one transition partner; inactive roots are hidden and their
  updates stop.
- `TransitionDirector` evaluates absolute, reversible transition windows. It does not use
  timers, cumulative transforms or independent tweens.
- `SpatialRouter` maps `#crown`, `#gate`, `#evofish`, `#crown-front`, `#network`, `#store`
  and `#profile` to native scroll positions and browser history.
- `AssetSlotRegistry` only accepts local paths and supplies deterministic fallbacks. The
  approved EvoFish key art is one lazy midground plane, not a fullscreen page background.
- High-frequency progress is written to CSS variables and runtime datasets. React updates
  only when the active chapter, boot stage, menu state or debug sample changes.

## Visual Review Matrix

Captures were made at deterministic normalized progress values in Chromium. The desktop
review used Candidate B LOD0 at DPR 1.0; mobile used AUTO and selected LOD2/LOW.

| Chapter | Focal point / depth / camera continuity | DOM hierarchy and mobile crop | Performance | Status |
| --- | --- | --- | --- | --- |
| Boot | Readiness signal over the already initialized chamber; no fake delay | One real `ENTER` control; reduced motion skips the hold after readiness | One canvas, no overflow | PASS |
| Crown Chamber | Candidate B silhouette inside radial supports, levitation plane and far structure; the camera begins the core approach | Brand, single headline and two actions remain left/bottom of the art; mobile keeps the central spire visible | 28 calls, 17,642 triangles, p95 25.5 ms | PASS |
| World Gate | Nested aperture, tunnel rings and shutters replace the Crown after the shell-to-core transition; no flat image circle | Minimal label; mobile removes competing body copy | 18 calls, 4,644 triangles, p95 25.3 ms | PASS |
| EvoFish Abyss | Approved subject art is a lazy midground plane between fog, caustic arcs and foreground silhouettes; camera exits the cyan gate into depth | Copy sits outside the subject on desktop and below it on mobile | 17 calls, 3,568 triangles, p95 25.1 ms | PASS |
| CROWN//FRONT Reactor | Ocean silhouettes become shutters while cyan cools into a local orange reactor and tactical rings | Operation CTA is real DOM and alpha status is honest | 52 calls, 9,304 triangles, p95 25.1 ms | WEAK: approved environment art is still absent |
| Network Core | Central command volume, depth-banded nodes and linking arcs; camera pulls back after the reactor | Primary worlds have DOM equivalents and remain keyboard reachable; mobile shows a reduced set | 56 calls, 7,152 triangles, p95 25.1 ms | PASS |
| Collection Vault | Network arcs align into vault rails and 3D collection housings; no checkout inside canvas | Shared catalog supplies labels and real prices; Store and Account remain ordinary authoritative routes | 17 calls, 2,988 triangles, p95 25.1 ms | WEAK: capsules are presentation placeholders |
| Identity Enter | Candidate B returns behind the identity core and final portal; camera recenters and the footer is integrated into the frame | Profile, Store, Lobby and legal actions are real DOM; mobile keeps all targets above the safe area | 60 calls, 25,054 triangles, p95 25.1 ms | PASS |

Mobile 390x844 stayed at 13-54 draw calls, 2,976-15,872 triangles, p95 10.2 ms,
one canvas and zero horizontal overflow in the local headless sample. Chromium/WebKit tests
also cover 393x852, 430x932 and 844x390. These are local measurements, not physical iPhone
Safari approval.

## Transition Review

- Crown to Gate: shell opens and the core aligns with the aperture before Crown detail is
  culled. The Gate continues spatially; it is not an opacity-only swap. PASS.
- Gate to EvoFish: ring depth stretches into caustic arcs while the subject plane arrives
  from behind the aperture. PASS.
- EvoFish to CROWN//FRONT: water darkens, silhouettes become shutters and orange rises from
  depth. The authored CROWN//FRONT environment remains a future asset slot. WEAK.
- Reactor to Network: tactical energy cools, camera pulls back and nodes assemble into
  depth bands. PASS.
- Network to Collection: node paths align into rails and housings without introducing a
  Store card. PASS.
- Collection to Identity: featured housings recede, Candidate B returns and the identity
  portal becomes the final CTA composition. PASS.

Every transform is evaluated from absolute global/local progress; reverse-scroll tests
compare repeat poses and no state accumulates.

## Final Questions

- Does it feel like one place? **Yes.** The same background, camera, particles and structural
  language continue across the full route.
- Are visible ordinary section boundaries present? **No.** Semantic sections occupy the
  document spine but do not render as stacked panels.
- Does Crown become a portal rather than simply fading? **Yes.** The core alignment, shell
  opening, occluding shutters and independent Gate geometry bridge the scenes.
- Does EvoFish emerge from the Gate? **Yes.** Its subject is revealed behind the aperture as
  mechanical rings become underwater depth layers.
- Does CROWN//FRONT emerge from the ocean? **Yes, procedurally.** The final authored art is
  still missing and is not being disguised as approved art.
- Does Network feel spatial? **Yes.** Nodes occupy multiple depth bands around a central
  command volume and have matching accessible DOM controls.
- Does Store feel integrated? **Yes at skeleton level.** Catalog-backed housings and rails
  lead to the existing Store rather than embedding fake commerce in WebGL.
- Does Identity complete the story? **Yes.** Crown, profile, collection, portal, CTA and legal
  navigation converge in one final frame without redirecting automatically.
- Does any scene look like a glass card pasted on top? **No.** Copy is unframed system chrome;
  no full-scene glass container is used.
- Does the site work without WebGL? **Yes.** The semantic spine, headings, links and CSS
  fallback remain available, and context loss does not reload the page.

## Capture Evidence

- Directory: `/tmp/blackcrown-experience-skeleton-v1/`
- Desktop: boot plus seven chapter frames at 1440x900
- Mobile: seven chapter frames at 390x844
- Reduced motion: Crown, Network and final frames
- Additional: full-page, desktop/mobile debug and contact sheet
- Contact sheet: `/tmp/blackcrown-experience-skeleton-v1/blackcrown-experience-skeleton-contact-sheet.png`

No capture artifact is tracked by Git.

## Final Validation

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS, lockfile unchanged |
| `test:assets` | PASS, 9/9 key-art assets |
| `test:crown-asset` | PASS, canonical manifest remains disabled |
| Site typecheck | PASS |
| Unit tests | PASS, 45/45 |
| Playwright Chromium | PASS, mode-off and lab suites |
| Playwright WebKit | PASS, mode-off and lab suites |
| Playwright total | PASS, 33 passed; one desktop-only Crown selector test skipped on WebKit |
| Mode-off build | PASS, initial JS 187.53 KB and CSS 47.74 KB by bundle gate |
| Lab build | PASS |
| Bundle budget | PASS; shell, Three and GLTF loader remain async |
| `npm run build:prod` | PASS; site, existing game, existing lobby and assembly completed |
| `git diff --check` | PASS |

The emitted lazy route is 24.74 KB minified, the runtime 79.35 KB, GLTFLoader 135.35 KB,
Three core 214.99 KB and renderer 357.34 KB. None is part of the mode-off initial entry.
The pre-existing `apps/game` build reports its own 500 KB chunk warning; that protected
application was not changed by this branch.
