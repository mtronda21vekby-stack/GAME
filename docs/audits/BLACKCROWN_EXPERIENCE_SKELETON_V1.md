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

## Visual Review Matrix

This matrix is completed after deterministic captures. `PLACEHOLDER` means the chapter has
not yet been implemented or captured; it is not a pass claim.

| Chapter | Focal point | Depth / transition | DOM / mobile | Performance | Status |
| --- | --- | --- | --- | --- | --- |
| Boot | Readiness signal | Static overlay over persistent scene | Real Enter control | Pending | PLACEHOLDER |
| Crown Chamber | Digital Crown | Chamber, supports, levitation field | Brand and two actions | Pending | PLACEHOLDER |
| World Gate | Crown core aperture | Rings, tunnel and shutters | Minimal label | Pending | PLACEHOLDER |
| EvoFish | Subject depth plane | Gate rays become water/caustics | Separate world action | Pending | PLACEHOLDER |
| CROWN//FRONT | Tactical reactor | Water collapses into shutters | Operation action and honest alpha status | Pending | PLACEHOLDER |
| Network | Command core | Nodes and structural arcs | DOM world equivalents | Pending | PLACEHOLDER |
| Collection | Featured catalog slots | Network paths become vault rails | Store and collection actions | Pending | PLACEHOLDER |
| Identity | Crown identity core | Vault converges into final portal | Profile, Store, Lobby, legal | Pending | PLACEHOLDER |

## Required Final Questions

- Does the experience feel like one place?
- Are any ordinary section boundaries visible?
- Does the Crown become a portal instead of fading out?
- Does EvoFish emerge from the gate?
- Does CROWN//FRONT emerge from the ocean transition?
- Does Network read as a spatial command center?
- Does Collection feel integrated instead of pasted on as a Store card?
- Does Identity complete the story?
- Does any scene look like a glass card over a canvas?
- Does the site remain navigable without WebGL?

