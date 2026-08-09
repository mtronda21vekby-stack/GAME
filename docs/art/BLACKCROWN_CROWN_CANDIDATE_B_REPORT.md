# BlackCrown Crown Candidate B Report

## Status

Candidate B is a local authored review candidate. It is not the canonical
production Crown, is not enabled by the production manifest, and requires
explicit user approval, KTX2 packaging, and physical iPhone Safari QA before
promotion.

- Source branch: `feature/blackcrown-production-crown-candidate-a-local-v1`
- Source checkpoint: `1033cc27d8a8d7c2658ae28d7cefe8eae983c9d8`
- Candidate B branch: `feature/blackcrown-production-crown-candidate-b-local-v1`
- Blender: `5.1.2`
- External assets: none
- Fixed seed: `240817`
- Canonical `crown.manifest.json`: unchanged, `enabled:false`

## Source And Reproduction

- Blend: `/tmp/blackcrown-production-crown-candidate-b/BlackCrown_Crown_Candidate_B.blend`
- Blend size: `435389` bytes
- Blend SHA-256: `e424fcdee0ac7c0a037ad0312492f4a30093e68067cfa63735c16eaf4ede693f`
- Generator: `tools/blender/blackcrown-crown/generate_candidate_b.py`
- Exporter: `tools/blender/blackcrown-crown/export_candidate_b.py`
- Renderer: `tools/blender/blackcrown-crown/render_candidate_b.py`
- Scene validator: `tools/blender/blackcrown-crown/validate_candidate_b_scene.py`
- Config: `tools/blender/blackcrown-crown/config/candidate-b.json`

```bash
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender

"$BLENDER" --background --python tools/blender/blackcrown-crown/generate_candidate_b.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-b.json \
  --output-blend /tmp/blackcrown-production-crown-candidate-b/BlackCrown_Crown_Candidate_B.blend

"$BLENDER" --background --python tools/blender/blackcrown-crown/export_candidate_b.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-b.json \
  --output-dir apps/site/public/experience/crown/candidate-b \
  --report /tmp/blackcrown-production-crown-candidate-b/candidate-b-export-record.json
```

## Candidate A Baseline

Candidate A remains byte-for-byte unchanged. Its source SHA-256 is
`c7e412a67bb63ea83a26b63f3cde36b6d891e324cd18f3305293ddc4e853b89c`.
Its principal weaknesses were broad shell planes, weak secondary curvature,
applied-looking lower rails, flat cyan strips, and a concentric portal that
read as a reactor rather than a mechanical aperture.

## Art Direction Changes

Candidate B keeps nine shell segments and nine spires while replacing the
flat shell with a profile-driven mesh carrying radial and vertical curvature,
taper, thickness, inner lips, physical gaps, and an integrated lower
containment arc. The center spire remains tallest and side spires use stepped
height bands.

Energy channels now use a shell recess, dark housing rails, end caps, shoulder
collars, and a thick diffuser. The core contains containment, energy volume,
nucleus, cage, and three non-identical broken rings. The portal adds seven
bone-driven iris blades, an aperture frame, cavity, shutters, tunnel semantics,
and multiple axial planes. Directed segment, spire, and iris transforms are
computed from absolute timeline progress and reverse without accumulated
drift.

The final LOD0 was reduced from the first visual candidate's 29,740 triangles
to 15,574 after equal-condition profiling exposed a GPU regression. The
profile, housing, core layers, and iris were retained; excess shell sampling
and bevel subdivisions were removed.

## Materials And Textures

The six-material HIGH contract is black titanium, inner gunmetal, carbon,
core glass, core energy, and portal energy. Candidate B uses six deterministic
512 by 512 PNG sources for LOD0 and three for LOD1/LOD2. They are embedded in
the GLB and contain no external URI. Estimated decompressed texture memory is
6,291,456 bytes for LOD0 and 3,145,728 bytes for LOD1/LOD2.

KTX2 is not claimed. `toktx`, `ktx`, `basisu`, and `gltf-transform` are absent.
`package_candidate_b_ktx2.sh` performs a local-only preflight and exits 1
without creating a fake package. Planned settings are UASTC plus mipmaps for
normal data and ETC1S plus mipmaps for base color/ORM, subject to visual and
WebKit verification.

Repeated scene generation preserves the seed, hierarchy, mesh statistics, and
all exported GLB hashes. Blender 5.1.2 changes a few bytes of internal `.blend`
save metadata between serializations, so the source-manifest records the exact
current container hash but does not claim byte-identical `.blend` saves.

## Hierarchy And LODs

All LODs retain the same semantic set: root, shell, core, portal, three rings,
nine segment bones, nine spire bones, seven iris blade bones, energy states,
aperture, cavity, shutters, and tunnel. LOD0 has 50 nodes and two skins;
LOD1/LOD2 have 48 nodes and two skins.

| LOD | Triangles | Asset draws | Materials | File bytes | SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| LOD0 | 15,574 | 12 | 6 | 1,453,888 | `7eb4542acbb0e0b727174c8e5a761647efbb62c908b53841a67cb35d3a9d759c` |
| LOD1 | 14,440 | 9 | 4 | 1,104,092 | `52c1047e35e3981c0be5ee03497da962b02a93e00e4aa1767e8cbadca7032bc1` |
| LOD2 | 6,416 | 8 | 4 | 669,088 | `4e30edd4796661098c09ac701d94bf2ab1c83c12ae913c9f819b032b398957dc` |

Bounds are 2.3344 x 1.9540 x 1.0127 m for LOD0, 2.3173 x 1.9540 x
0.7850 m for LOD1, and 2.3172 x 1.9546 x 0.7844 m for LOD2. Validator
checksums, budgets, semantic parity, finite transforms, root identity, embedded
texture dimensions, and the no-camera/light/animation contract pass.

## Runtime Integration

Candidate B is reachable only through the local allowlist:

```text
VITE_BC_CROWN_ASSET_OVERRIDE=candidate-b
/nexus-lab?nexuscrown=candidate-b
```

The debug/device-QA selector supports procedural, Candidate A, and Candidate B.
Switching first activates the procedural handoff, aborts the old load, releases
the old lease, disposes the visual, and loads one selected LOD. It does not
create a second renderer, canvas, RAF owner, or ScrollDirector. An invalid
selection cannot provide an external URL and falls back to procedural.

## Equal-Condition Performance

Source: `/tmp/blackcrown-production-crown-candidate-b/candidate-a-b-runtime-report.json`.
Both candidates were measured in fresh Chromium processes at 1440 by 900,
HIGH quality, DPR 1, using the same runtime FrameSampler, 600 ms warmup and
3,000 ms sample window. FPS is derived only from median frame time.

| Chapter | Candidate A median / p95 / worst ms | Candidate B median / p95 / worst ms |
| --- | --- | --- |
| Inspection | 16.7 / 25.0 / 25.1 | 16.7 / 25.1 / 50.0 |
| Core Reveal | 16.7 / 25.3 / 26.0 | 16.7 / 25.2 / 26.0 |
| CROWN//FRONT | 24.9 / 25.2 / 26.0 | 25.0 / 25.7 / 33.0 |
| Ecosystem | 24.1 / 25.4 / 26.0 | 24.9 / 25.9 / 26.1 |
| Enter | 16.8 / 25.4 / 26.0 | 24.3 / 25.3 / 25.9 |

Candidate B p95 is within approximately 2% of Candidate A in every chapter,
so the earlier greater-than-10% regression is removed. The local headless
environment quantizes several samples at roughly 25 ms; neither candidate
meets the aspirational absolute 22 ms p95 in all chapters. Candidate B also
recorded one 50 ms Inspection spike. These remain WEAK items for physical
device profiling, not grounds to claim an iPhone pass.

Candidate A load was 5.3 ms fetch, 20.3 ms parse, 4.1 ms bind, and 62.9 ms to
the first candidate frame. Candidate B was 3.6 ms fetch, 18.2 ms parse, 4.0 ms
bind, and 75.7 ms to the first candidate frame. Route exit produced zero
canvases; re-entry produced one canvas, one RAF owner, two route entries, and
one route disposal.

## Visual Review

- Candidate B renders: `/tmp/blackcrown-production-crown-candidate-b/`
- A/B sheets: `/tmp/blackcrown-production-crown-candidate-b/compare-a-b-*.png`
- Nexus desktop/mobile/reduced captures: same directory
- Offline gallery: `/tmp/blackcrown-production-crown-candidate-b/review/index.html`

Visual classification:

- PASS: stronger crown silhouette, authored shell curvature, integrated lower
  arc, recessed channel construction, layered core, and real iris depth.
- PASS: LOD2 retains the nine-spire Crown read and mobile AUTO selects LOD2.
- WEAK: several shoulder/support junctions still reveal procedural repetition;
  portal close-up remains mechanically dense; the WebGL scene deliberately
  darkens titanium and should be judged on a calibrated display.
- BLOCKER: no user visual approval, no KTX2 package, and no physical iPhone
  Safari run.

## Mobile And QA

Automated captures cover 390 by 844, 430 by 932, and 844 by 390. AUTO resolves
Candidate B to LOW/LOD2, horizontal overflow is zero, canvas count is one, and
the CTA remains hittable. Reduced motion resolves to LOW/LOD2 and keeps the
assembled Crown accessible. Physical iPhone Safari testing has not been
performed.

Local device route:

```text
/nexus-lab?nexuscrown=candidate-b&bcdeviceqa=1
```

## Promotion Gate

The exact next step is user review of the local A/B gallery. If Candidate B is
accepted visually, install KTX-Software outside this task, produce and validate
the KTX2 package, then run the documented physical iPhone Safari matrix. Only
after those gates may a separate task consider canonical manifest activation.
