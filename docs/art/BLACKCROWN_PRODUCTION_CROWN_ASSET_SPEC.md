# BlackCrown Production Crown Asset Specification

Version 1.0. This is the handoff contract for the approved authored Digital Crown.
It is not permission to substitute a marketplace or generic sci-fi model.

## Delivery

- Deliver binary glTF 2.0 (`.glb`) for LOD0, LOD1 and LOD2.
- Y is up, the front of the Crown faces +Z, and the root pivot is at world origin.
- The base is near Y=0. Units are meters. Root scale is 1.
- Apply all transforms. Negative scales, hidden duplicate geometry and linked assets are forbidden.
- Do not export production cameras, lights, skins, morph targets or baked choreography.
- Do not use external or remote URIs. Textures must be embedded in the GLB.
- Do not bake text, logos or UI into textures.

Target envelope: height 1.6-2.0 m, width 1.8-2.4 m and depth 0.65-1.1 m.
The validator warns outside the target and rejects obviously incorrect unit scales.

## Required nodes

Names are unique, case-sensitive and identical across all LODs:

```text
BC_CROWN_ROOT
BC_SHELL_ROOT
BC_CORE_ROOT
BC_PORTAL_ROOT
BC_RING_INNER
BC_RING_MIDDLE
BC_RING_OUTER
BC_SEG_00 ... BC_SEG_08
BC_SPIRE_00 ... BC_SPIRE_NN
```

The manifest declares 9-11 segments and the exact spire count. Optional stable names:

```text
BC_ENERGY_CYAN
BC_ENERGY_ORANGE
BC_CORE_CONTAINMENT
BC_CORE_VOLUME
BC_CORE_NUCLEUS
BC_PORTAL_APERTURE
BC_PORTAL_TUNNEL
BC_PORTAL_SHUTTERS
BC_BASE_FIELD
```

Every independently animated segment and spire needs an intentional local pivot.
Assembly and opening use node transforms, not skeletal or baked animation.

## Materials

Use only the required subset of these stable semantic names:

```text
BC_MAT_SHELL_TITANIUM
BC_MAT_INNER_GUNMETAL
BC_MAT_CARBON
BC_MAT_CORE_GLASS
BC_MAT_CORE_ENERGY
BC_MAT_ENERGY_CYAN
BC_MAT_ENERGY_ORANGE
BC_MAT_PORTAL
```

Do not deliver automatic names such as `Material.001`. The runtime maps authored
materials to quality-specific BlackCrown materials. Budgets are 8 materials for
LOD0, 6 for LOD1 and 4 for LOD2; preferred counts are 4-6, 3-5 and 2-4.

## Geometry budgets

| LOD | Target triangles | Hard maximum | Crown draw calls |
| --- | ---: | ---: | ---: |
| LOD0 / HIGH | 50k-85k | 100k | 20 |
| LOD1 / MEDIUM | 20k-40k | 50k | 14 |
| LOD2 / LOW | 6k-15k | 20k | 8 |

Prefer merged static geometry where independent animation is not required. No
skinned meshes or morph targets are accepted in this pipeline version.

## Textures

- LOD0: at most 2048 px, packed ORM, normal, emissive mask, optional microdetail.
- LOD1: 1024-2048 px with a reduced material set.
- LOD2: 512-1024 px, no required clearcoat or transmission.
- 4K and 8K textures are forbidden.
- Base color and emissive are sRGB. Normal, roughness, metalness and AO are linear/no-color-space.
- Prefer KTX2/Basis Universal only when the local transcoder configuration is delivered and tested.

Decompressed Crown texture targets: HIGH <= 48 MB, MEDIUM <= 32 MB and LOW <= 24 MB.

## File budgets

| LOD | Target | Hard maximum |
| --- | ---: | ---: |
| LOD0 | 6 MB | 8 MB |
| LOD1 | 3.5 MB | 5 MB |
| LOD2 | 1.8 MB | 2.5 MB |

Budget failures are fixed in the asset; runtime or CI limits are not increased.

## Visual contract

The silhouette has a high central spire, controlled asymmetric side spires, a
recognizable Crown arc, physical shell gaps and a layered core. Materials read as
black titanium, gunmetal and carbon. Cyan is the identity energy; tactical orange
appears only in CROWN//FRONT. Medieval, fantasy, gold, baroque, gemstone and random
cyberpunk-clutter treatments are out of scope.

## Blender export checklist

1. Apply transforms and confirm +Z front / +Y up in a clean scene.
2. Validate unique names, pivots, segment count and material names.
3. Remove cameras, lights, animations, skins, morph targets and unused data blocks.
4. Pack textures and verify color spaces and maximum dimensions.
5. Export one self-contained GLB per LOD with no external URI.
6. Place files under `apps/site/public/experience/crown/lodN/` using README names.
7. Run `pnpm --filter @blackcrown/site test:crown-asset` before enabling the manifest.
8. Review all seven chapters in desktop, mobile and reduced-motion modes.
