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

This section will be completed after the implementation and identical after-capture pass.
