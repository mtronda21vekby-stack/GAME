# BlackCrown Digital Crown Candidate A Report

## Status

Candidate A is a local technical and visual review candidate. It is not an
approved production asset. The canonical production Crown manifest remains
disabled, and Candidate A is available only through the allowlisted Nexus Lab
override.

## Provenance

- Source branch: `feature/blackcrown-crown-glb-pipeline-local-v1`
- Source commit: `91b71c9f2358409a7a591a1ffbf35e4745acdd5e`
- Candidate branch: `feature/blackcrown-production-crown-candidate-a-local-v1`
- Blender: `5.1.2`
- Blender binary: `/Applications/Blender.app/Contents/MacOS/Blender`
- Generation script: `tools/blender/blackcrown-crown/generate_candidate_a.py`
- Config: `tools/blender/blackcrown-crown/config/candidate-a.json`
- Fixed seed: `240809`
- Source blend: `/tmp/blackcrown-production-crown-candidate-a/BlackCrown_Crown_Candidate_A.blend`
- Source blend bytes: `373507`
- Source blend SHA-256: `c7e412a67bb63ea83a26b63f3cde36b6d891e324cd18f3305293ddc4e853b89c`
- External meshes, textures, HDR files, shaders or decoders: none

## Authoring And Geometry

The asset uses nine authored radial shell segments and nine spires. A single
skinned shell mesh binds segment and spire bones to the existing absolute
`CrownVisual` timeline. The central spire is tallest, side spires step down,
the shell widens toward the base, and physical gaps preserve the silhouette.

The shell contains a second material primitive for nine cyan identity
channels. It reuses `BC_MAT_CORE_ENERGY`, keeping the production material and
LOD2 budgets intact. Static core, rings, base, inner structure and portal
objects remain separate shared-material meshes. No baked animation,
`AnimationMixer`, morph target, production light or production camera is
exported.

The core contains containment, volume, nucleus and cage layers at LOD0. Three
independent ring nodes retain their semantic pivots. The portal contains a
two-depth-ring aperture and radial spokes; tactical orange is controlled by
the existing deterministic timeline.

## Materials And Textures

Controlled materials use the existing production names:

- `BC_MAT_SHELL_TITANIUM`
- `BC_MAT_INNER_GUNMETAL`
- `BC_MAT_CARBON`
- `BC_MAT_CORE_GLASS`
- `BC_MAT_CORE_ENERGY`
- `BC_MAT_PORTAL`

The source texture set is generated locally and deterministically at 512 by
512 pixels. It contains shell and carbon base-color, normal and packed ORM
sources. GLBs embed their images and contain no external URI. `toktx` and
`ktx` are not installed, so KTX2 compression is intentionally not claimed.

HIGH uses controlled shell clearcoat and standard transparent core glass.
Three.js transmission was deliberately removed after an isolated performance
sample showed a 50 ms capped frame path; standard glass restored the HIGH
Candidate to a 16.7 ms median and 24.8 ms p95 without changing LOD0.

## LOD Results

| LOD | Triangles | Draw calls | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| LOD0 | 14,212 | 12 | 2,563,068 | `b4281db7f10829860199cb8ef917b267140b0a63da2392e7d0adda3bc8e1c88d` |
| LOD1 | 6,880 | 9 | 1,282,496 | `81f3d0ec8d4bc42b0a02351e3f77a06ce4697208d10e558246ed7df822079496` |
| LOD2 | 3,324 | 8 | 785,340 | `1a44ed732286101688eddd69e59ac99008b5923b98fa14f90674d908d87c1127` |

All LODs pass the unchanged triangle, draw-call, material and file-size hard
budgets. Required semantic node names and the nine segment/spire bindings are
identical across LODs. The validator also passes root transforms, finite
matrices, world bounds, embedded image dimensions, checksums and the absence
of cameras, lights, animations, morphs and remote resources.

## Runtime Integration

Local activation:

```bash
VITE_BC_EXPERIENCE_MODE=lab \
VITE_BC_EXPERIENCE_DEBUG=1 \
VITE_BC_EXPERIENCE_QUALITY=high \
VITE_BC_CROWN_ASSET_OVERRIDE=candidate-a \
corepack pnpm --filter @blackcrown/site dev --host 127.0.0.1 --port 5194
```

Development query activation is `?nexuscrown=candidate-a`. Both paths resolve
to a hardcoded local manifest; arbitrary URLs are rejected. Mode `off`, the
ordinary Home route and invalid overrides do not request Candidate A. Any
manifest, fetch, parse, binding or validation failure returns the procedural
Crown without a reload.

The runtime uses `SkeletonUtils.clone` only inside the lazy GLB path so cached
skinned scenes retain independent skeletons. Directed assembly, open, core and
portal transforms are recomputed from base transforms each frame, including a
small central aperture during Core Reveal. Reverse scroll returns the same pose
signature. Route exit aborts pending work and releases the active cache lease.

## Performance

Both captures use the built-in FrameSampler at 1440 by 900, DPR 1, HIGH,
Inspection progress 0.34, with screenshots excluded from the sample window.

| Backend | Median | P95 | Worst | Draw calls | Triangles |
| --- | ---: | ---: | ---: | ---: | ---: |
| Procedural | 8.6 ms | 17.4 ms | 17.6 ms | 51 | 8,236 |
| Candidate A LOD0 | 16.7 ms | 24.8 ms | 26.6 ms | 22 | 13,888 |

Candidate A loading measured 5.3 ms fetch, 20.3 ms parse, 4.0 ms bind and
63.7 ms from attach to the first rendered Candidate frame. It used eight
renderer textures, nineteen geometries and approximately 8,388,612 bytes of
estimated texture memory. One canvas and one RAF owner were active. These are
local headless Chromium figures, not physical iPhone results.

Raw local reports:

- `/tmp/blackcrown-production-crown-candidate-a/procedural-runtime-metrics-clean.json`
- `/tmp/blackcrown-production-crown-candidate-a/candidate-a-runtime-metrics-clean.json`

## Visual Review

Neutral stills and the sixteen-frame turntable are under
`/tmp/blackcrown-production-crown-candidate-a/`. The same directory contains
seven deterministic desktop Nexus captures, four mobile captures and two
reduced-motion captures.

PASS:

- The central and stepped side spires read as a Crown in neutral and silhouette renders.
- Shell gaps, base arc, core layers, rings and portal remain identifiable without bloom.
- Cyan channels preserve the dark silhouette in Nexus without raising material budgets.
- Core Reveal opens a deterministic central aperture and reverse scroll restores the bind pose.
- The central mobile spire remains below the route header at 390 by 844.
- Tactical orange remains localized to the CROWN//FRONT portal system.

WEAK:

- The broad shell planes and lower panel rails remain visibly parametric and need a manual Blender art pass.
- Cyan channels are intentionally simple and need authored recesses/diffusers for a final hero asset.
- Portal spokes and the LOD2 core are production-budget shapes, not final close-up geometry.
- Candidate A costs more frame time than the procedural backend in local headless Chromium.

BLOCKER FOR FINAL APPROVAL:

- No user visual approval has been given.
- KTX2 texture variants are absent because local KTX tooling is unavailable.
- No physical iPhone Safari or mobile-GPU profile has been performed.

Candidate A therefore remains lab-only and the canonical production manifest
remains `enabled: false`.

## Validation And Next Step

Run:

```bash
corepack pnpm --filter @blackcrown/site test:crown-asset -- --candidate candidate-a
```

The exact next art step is a manual Blender pass on hero shell curvature,
panel transitions, recessed energy channels and portal iris depth, followed by
KTX2 packaging, user visual approval and the physical iPhone Safari QA matrix.
Only after those gates should these candidate files be promoted into the
canonical production Crown slot.
