# BlackCrown Crown Candidate B Baseline

## Safety And Provenance

- Source branch: `feature/blackcrown-production-crown-candidate-a-local-v1`
- Source commit: `1033cc27d8a8d7c2658ae28d7cefe8eae983c9d8`
- Candidate B branch: `feature/blackcrown-production-crown-candidate-b-local-v1`
- Working tree before the branch was clean.
- Blender: `5.1.2` at `/Applications/Blender.app/Contents/MacOS/Blender`
- Candidate A source SHA-256: `c7e412a67bb63ea83a26b63f3cde36b6d891e324cd18f3305293ddc4e853b89c`
- Candidate A was rendered from its existing source blend and was not regenerated or modified.

Fresh baseline renders are outside Git under
`/tmp/blackcrown-production-crown-candidate-b/baseline-a/`. They use the
Candidate A camera, exposure, lighting and Blender version.

## Reproduced Asset Baseline

| LOD | Nodes | Meshes | Primitives | Materials | Textures | Triangles | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LOD0 | 37 | 11 | 12 | 6 | 6 | 14,212 | 2,563,068 |
| LOD1 | 36 | 8 | 9 | 5 | 3 | 6,880 | 1,282,496 |
| LOD2 | 36 | 7 | 8 | 4 | 3 | 3,324 | 785,340 |

LOD0 accessor bounds are approximately `[-1.157, -0.542, -0.359]` to
`[1.157, 1.977, 0.307]`. LOD1 and LOD2 preserve the same origin and visual
envelope within expected simplification tolerance. The repository validator
passes all three Candidate A LODs with their original checksums.

The comparable local HIGH runtime baseline remains 16.7 ms median, 24.8 ms
p95 and 26.6 ms worst at 1440 by 900, DPR 1, Inspection progress 0.34. These
figures are retained as the A side of the Candidate B comparison and will be
remeasured with the same sampler before final reporting.

## Candidate A Visual Findings

### Shell And Silhouette

The nine-spire rhythm and tall center establish a readable Crown. The primary
shell faces, however, are broad, almost planar blades. Their highlights do not
roll across the surface, so front and three-quarter views lose authored volume.
The silhouette remains strongest at the tips and weakest through the middle
body, where every segment follows nearly the same vertical profile.

### Panel Flow And Lower Arc

The upper and lower shell portions meet with an abrupt horizontal break. The
two lower rails read as separate strips attached across otherwise independent
panels. Their repeated rectangular supports do not continue the radial shell
flow, and the outer containment arc is visible mostly behind the segments
instead of resolving the bases into one Crown structure.

### Energy Channels

The cyan channels are flat rectangular emissive strips. They have no physical
recess, dark housing, diffuser thickness or authored termination. Their value
contrast helps mobile readability, but the geometry reads as an overlay and
becomes the first prototype signal in close views.

### Core, Rings And Portal

The contained core has multiple layers, but its silhouette is partly hidden by
the central segment and repeated circular cages. The three rings use similar
round profiles and spacing. The portal is a stack of concentric rings and
spokes with no mechanical shutters, axial cavity or foreground occlusion, so
the open state reads as a decorated reactor rather than a traversable iris.

## Candidate B Priorities

Highest visual return inside mobile and draw-call budgets:

1. Replace the planar shell face with a profile-driven, doubly curved segment.
2. Continue each segment into a stepped containment base instead of adding rails across it.
3. Build one recessed channel system with housing and diffuser geometry sharing materials.
4. Preserve the nine-spire Crown envelope while varying shoulder and tip profiles.
5. Replace the portal ring stack with a seven-blade mechanical iris and real axial planes.
6. Give the three rings distinct broken cross-sections without obscuring the center spire.
7. Improve core containment and couplings before adding any extra emissive effect.

Details that must remain restrained are hidden back surfaces, small fasteners,
micro panel cuts, transparent core layers and LOD2 channel housings. They have
low mobile return and can increase triangles, overdraw or material splits
without improving the Crown read.

## Gates

- Candidate A files, manifests, checksums, report and tracked renders remain immutable.
- Canonical production manifest remains `enabled: false`.
- KTX2 tools are not installed. Candidate B may use embedded PNG for review,
  but canonical packaging remains blocked until a real local compressor is supplied.
- Candidate B must beat the A silhouette and portal-depth baseline without higher bloom.
