# BLACKCROWN Experience Art Direction V3

## Baseline

- Source branch: `feature/blackcrown-experience-skeleton-v2-local`
- Source commit: `86ee009189fc35380bbe63ff0749766453b1c504`
- V3 branch: `feature/blackcrown-experience-art-direction-v3-local`
- Worktree before changes: clean
- Backup: `/tmp/blackcrown-experience-art-direction-v3-backup-20260809-230317/`
- Review backend: Candidate B, explicit lab override
- Production experience mode: `off`
- Canonical Crown manifest: `enabled:false`

## Capture Contract

The deterministic before set is stored outside Git at:

`/tmp/blackcrown-experience-art-direction-v3/before/`

It contains chapter midpoints at 1440x900, 390x844, 430x932 and 844x390,
six transition midpoints, reduced-motion frames, debug evidence and:

`before/blackcrown-art-direction-v3-before-contact-sheet.png`

All captures use the same Candidate B backend, normalized story progress and a stable
smoothed/target progress pair. Main captures hide technical overlays.

## Performance Baseline

| Chapter | Median | P95 | Draw calls | Triangles | Textures | Active scenes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Crown Chamber | 17.0 ms | 25.7 ms | 28 | 17,642 | 9 | 1 |
| World Gate | 9.5 ms | 25.2 ms | 18 | 4,644 | 10 | 1 |
| EvoFish | 8.4 ms | 25.0 ms | 17 | 3,568 | 11 | 1 |
| CROWN//FRONT | 8.4 ms | 25.0 ms | 52 | 9,304 | 11 | 1 |
| Network | 8.4 ms | 25.0 ms | 56 | 7,152 | 11 | 1 |
| Collection | 8.4 ms | 25.0 ms | 17 | 2,988 | 11 | 1 |
| Identity | 8.4 ms | 25.0 ms | 60 | 25,054 | 11 | 1 |

Candidate B HIGH reports about 8.0 MiB estimated Crown texture memory. Mobile AUTO selects
LOD2/LOW, uses 13-54 calls and remains at p95 10.0 ms in the local headless sample.

Transition capture exposes a pre-existing frame-pacing weakness: transition midpoints report
p95 33.3-34.0 ms even when draw calls are low. V3 must bring this below 30 ms without changing
the renderer, adding a second RAF or increasing budgets.

## Baseline Visual Findings

| World | Baseline problem | Classification |
| --- | --- | --- |
| Crown Chamber | Crown silhouette is valid but undersized/dim; first composition retains loader-like empty space | WEAK |
| World Gate | Perfect concentric rings and a flat central disc read as another reactor, not a passage | BLOCKER |
| EvoFish | Approved subject is present, but its rectangular raster plane and centered typography remain visible | WEAK |
| CROWN//FRONT | One orange sphere plus rings carries almost the entire world identity | BLOCKER |
| Network | Large central orb and circular framing repeat Gate/Reactor grammar; nodes are too uniform | BLOCKER |
| Collection | Repeated dark capsules have no category identity, rarity hierarchy or convincing vault structure | BLOCKER |
| Identity | Crown returns, but another central orb/ring makes it visually close to Network | WEAK |

## Composition Findings

- The same oversized display block is reused too often.
- Crown and Collection copy both occupy the left; Network and EvoFish both use the right.
- Foreground elements exist, but most remain frame decoration instead of camera-crossing
  occlusion.
- Black materials lose curvature outside Candidate B highlights.
- Gate, Reactor, Network, Collection and Identity all rely on circles as their dominant shape.
- Semantic sections are not visually stacked; the spatial shell itself remains a PASS.

## Protected Foundation

The V3 pass must preserve the existing `ExperienceRuntime`, `SceneRegistry`, `SpatialRouter`,
`TransitionDirector`, `ScrollDirector`, Crown adapters, Candidate binaries and commerce routes.
Only presentation modules, bounded scene helpers, tests and local capture tooling are in scope.

## Final Review

The final deterministic set is stored outside Git at:

- `/tmp/blackcrown-experience-art-direction-v3/after/`
- `/tmp/blackcrown-experience-art-direction-v3/after/blackcrown-art-direction-v3-after-contact-sheet.png`
- `/tmp/blackcrown-experience-art-direction-v3/comparisons/blackcrown-art-direction-v3-before-after.png`

Performance comparison uses the same prewarmed capture harness on the detached `86ee009`
baseline and V3. Prewarm traverses the requested progress points before resetting the sampler,
so first shader compilation is excluded from steady chapter and transition values.

| Chapter | Baseline median / p95 | V3 median / p95 | Calls before -> after | Triangles before -> after | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Crown Chamber | 16.6 / 26.0 ms | 16.0 / 26.0 ms | 28 -> 27 | 17,642 -> 18,018 | PASS |
| World Gate | 16.4 / 25.9 ms | 15.7 / 26.0 ms | 18 -> 21 | 4,644 -> 4,812 | PASS |
| EvoFish | 16.4 / 25.9 ms | 15.7 / 26.0 ms | 17 -> 22 | 3,568 -> 3,684 | PASS |
| CROWN//FRONT | 16.4 / 25.9 ms | 15.7 / 26.0 ms | 52 -> 24 | 9,304 -> 4,948 | PASS |
| Network | 16.4 / 25.9 ms | 15.7 / 26.0 ms | 56 -> 47 | 7,152 -> 2,804 | PASS |
| Collection | 16.4 / 25.9 ms | 15.7 / 26.0 ms | 17 -> 23 | 2,988 -> 2,812 | PASS |
| Identity | 16.4 / 25.9 ms | 15.7 / 26.0 ms | 60 -> 30 | 25,054 -> 19,458 | PASS |

All six transition midpoints report median `8.7 ms`, p95 `24.9 ms`, one current scene plus
one transition partner, and 20-54 total draw calls. Baseline transition p95 was 33.4-33.9 ms.
The improvement comes from removing the obsolete shared portal overlay and rendering only the
semantic silhouette/core of the non-dominant partner. It does not change the single renderer,
RAF, camera, ScrollDirector or absolute transition progress.

Mobile Candidate B AUTO resolves LOW/LOD2. The 390x844 final set reports p95 `10.1 ms`,
18-32 draw calls, 2,576-10,420 triangles, no horizontal overflow and about 4 MiB estimated
Crown texture memory. Desktop reports 8 MiB.

## World Review

### Crown Chamber - PASS

- Focal point and silhouette: Candidate B occupies the center-right hero zone; central spire,
  side spires, lower arc and core read on the first ready frame.
- Environment: asymmetric containment supports, levitation plane and near shell edges frame the
  Crown without creating a card.
- Lighting: cold key, cyan rim, neutral fill and localized core light expose black-titanium
  curvature without full-shell emission.
- DOM: left editorial composition leaves the core clear. Mobile puts the Crown above copy and
  preserves both 44 px actions.

### World Gate - PASS

- Focal point: an asymmetric polygonal aperture with a separate deep nucleus.
- Environment grammar: broken arcs, axial tunnel wall, radial ribs, streaks and edge shutters;
  the aperture is deliberately non-circular and non-uniformly scaled.
- Transition: the Crown moves behind the camera by progress `0.23`; Gate geometry continues the
  core axis instead of crossfading a disc.
- Remaining weakness: this is procedural geometry, so authored surface detail is intentionally
  restrained.

### EvoFish - PASS with asset limitation

- Depth: one approved key-art texture is embedded among a far water volume, caustic planes,
  seeded bubbles, midground silhouettes and sparse organic foreground occluders.
- Material: dark-tone lift reveals the subject body without duplicating the texture or exposing
  a hard rectangular plane.
- Composition: desktop copy is low-left; mobile keeps the fish above copy and CTA.
- Limitation: true separated fish/background layers require an approved layered source later.

### CROWN//FRONT - PASS as procedural environment

- The former orange sphere is replaced by a faceted containment cage, open axial energy volume,
  separate nucleus, eight shutters, mechanical ribs, bridge planes, chamber walls and tactical
  light bars.
- Orange remains local to reactor energy. Black/gunmetal structure and residual cyan system
  lights keep BlackCrown identity.
- The right/bottom-right tactical DOM block avoids the brightest core and remains an explicit
  link to the existing game route.

### Network - PASS

- The command core is offset; nine non-identical housings occupy asymmetric positions across
  multiple depth bands, connected by data paths and sparse city structures.
- LOW uses five compact primary nodes; secondary destinations remain available in accessible DOM.
- The scene no longer depends on a flat central ring or identical spheres.

### Collection - PASS

- Data source: authoritative shared `COMMERCE_CATALOG`; deterministic subset is Aurora Skin,
  Founder Badge and Starter Bundle.
- Housings: armor display, radial medallion and multi-cell vault map directly from real categories;
  rarity drives only the controlled accent.
- DOM exposes real title/category/rarity and routes to `/store` and `/account`. No canvas purchase
  or fake price was introduced.

### Identity - PASS

- Candidate B returns as the identity symbol; broken profile arcs, a small bound core, vertical
  data columns and central axis replace the previous Network-like orb.
- Final copy is centered with integrated legal/footer DOM and free CTA space.
- No automatic redirect is present.

## Explicit Answers

1. Crown is visible immediately: **YES**.
2. Gate reads as a passage: **YES**, through axial depth, asymmetric aperture and camera penetration.
3. EvoFish is organically distinct: **YES**, with water absorption and organic depth layers.
4. CROWN//FRONT is no longer an orange sphere: **YES**.
5. Network is no longer a flat ring: **YES**.
6. Collection is no longer two placeholder capsules: **YES**.
7. Identity differs from Network: **YES**.
8. Foreground occlusion exists: **YES**, scene-owned and quality-capped.
9. Text layout repeats: **NO**; seven explicit layout contracts are tested.
10. Black materials read: **YES**, via bounded fill, key/rim highlights and restrained emissive accents.
11. Visible ordinary section boundaries: **NO**.
12. One camera and one world: **YES**; one canvas/renderer/RAF/ScrollDirector remain.
13. Procedural placeholders remaining: Gate surface art, reactor chamber, Network architecture,
    vault housings, Identity framing and all foreground occluders.
14. Approved art still needed: layered EvoFish source and final authored CROWN//FRONT environment.
15. Physical iPhone Safari performed: **NO**.

## Final Classification

- PASS: architecture preservation, Crown first frame, world differentiation, DOM rhythm,
  foreground depth, shared catalog integration, mobile composition, transition performance.
- WEAK: procedural environments do not yet carry authored texture/surface language; EvoFish remains
  a single approved raster source.
- BLOCKER: none in automated desktop/mobile review.
