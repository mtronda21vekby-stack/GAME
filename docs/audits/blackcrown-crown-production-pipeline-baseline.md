# BlackCrown Crown Production Pipeline Baseline

Date: 2026-08-09

## Git baseline

- Branch before the pipeline pass: `feature/blackcrown-nexus-visual-pass-v1`.
- Checkpoint: `dd0593a5c58b948ae0f2bfa6accd3c2f34636239`.
- Working branch: `feature/blackcrown-crown-glb-pipeline-local-v1`.
- The source worktree was clean. `git diff --check` passed.
- Backup: `/tmp/blackcrown-crown-glb-backup-20260809-140831`.

## Current Crown contract

`CrownVisual` is the only Crown contract consumed by the runtime. It exposes a root,
shell, core and rings plus absolute setters for assembly, shell opening, core
intensity and portal progress. `update()` receives the evaluated normalized timeline,
elapsed time and reduced-motion state. `dispose()` owns visual resources.

The active implementation is `CrownPrototype`. It is constructed synchronously by
`ExperienceRuntime`, attached to `SceneRoot` and driven by `ChapterDirector`. There is
no GLB loader, decoder, asset cache, Crown manifest fetch or model binding layer.

## Runtime ownership

- `BlackCrownExperience` dynamically imports `ExperienceRuntime` only inside the enabled Nexus route.
- `ExperienceRuntime` owns one renderer host, scene, perspective camera, RAF, scroll director and Crown.
- `RendererHost` owns one canvas and handles `webglcontextlost`/`webglcontextrestored`.
- Route cleanup cancels RAF, removes listeners, disposes scene systems, forces context loss and removes the canvas.
- Existing route leave/re-entry tests assert canvas removal and one clean canvas after re-entry.

## Quality and device baseline

AUTO resolves from reduced motion, Save-Data, coarse pointer, viewport width, device
memory and hardware concurrency. Presets cap DPR at 1.0 / 1.25 / 1.5 for LOW /
MEDIUM / HIGH. Current presets do not sample p50/p95 frame time, expose GPU limits,
downgrade a loaded Crown LOD, estimate texture memory or export device diagnostics.

Mobile uses LOW and the approved procedural composition. Reduced motion keeps the
content accessible and lets the single RAF idle when scroll is settled. The current
context-lost path stops rendering and the restored path resets renderer state; no
lost/restored counters or DOM report exist yet.

## Asset loading baseline

- Crown source: procedural geometry in the lazy Nexus runtime.
- Runtime network assets: none.
- `GLTFLoader`, `DRACOLoader`, `KTX2Loader` and Meshopt are not imported.
- `public/` has key art, game previews, network art and PWA icons; there is no production Crown slot.
- Mode `off` does not mount the Nexus route and therefore does not request Three.js.

## Baseline validation

All commands were run before runtime changes from checkpoint `dd0593a`.

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS, lockfile current |
| `test:assets` | PASS, 9 assets |
| `typecheck` | PASS |
| unit tests | PASS, 19/19 |
| Playwright Chromium + WebKit | PASS, 16/16 |
| site build | PASS, 149 modules |
| bundle budget | PASS |
| `build:prod` | PASS |

## Bundle baseline

| Asset | Minified size |
| --- | ---: |
| Initial entry JS | 191.21 KiB |
| Initial CSS | 47.74 KiB |
| Nexus route | 10.94 KiB |
| Experience runtime | 31.35 KiB |
| Three.js lazy chunk | 467.44 KiB |

There is no GLTFLoader chunk and no GLB, manifest, decoder or Crown texture request.
The current approved visual-pass measurements are approximately 51 calls / 8,236
triangles in Inspection, 81 / 12,924 in the portal chapter and 121 / 16,092 in the
largest ecosystem composition. These browser measurements are local desktop evidence,
not physical iPhone results.

## Pipeline risks to control

1. A late GLB promise must not attach after route disposal.
2. StrictMode and route re-entry must not duplicate fetches, parses, materials or contexts.
3. The scroll timeline must never inspect authored node names or accumulate transforms.
4. Mode `off` must keep the current initial graph free of Nexus, manifest and GLTF work.
5. Missing or invalid authored assets must retain the visible procedural Crown without a user-facing error.
