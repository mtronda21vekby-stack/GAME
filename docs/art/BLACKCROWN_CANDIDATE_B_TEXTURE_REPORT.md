# BlackCrown Candidate B Texture Report

## Status

Candidate B uses deterministic, locally generated embedded PNG textures for
the review package. KTX2 packaging is blocked by missing local tooling and is
not simulated.

## Source Set

All sources are 512 by 512 pixels:

| Set | Base color | Tangent normal | Packed ORM |
| --- | --- | --- | --- |
| Shell | `BCB_Shell_BaseColor.png` | `BCB_Shell_Normal.png` | `BCB_Shell_ORM.png` |
| Carbon | `BCB_Carbon_BaseColor.png` | `BCB_Carbon_Normal.png` | `BCB_Carbon_ORM.png` |

The shell set carries restrained directional brushing, low-amplitude normal
variation and packed roughness/metalness. The carbon set is confined to the
inner cage and avoids glossy automotive treatment. Energy remains
material-driven and does not add a separate atlas.

## LOD Package

| LOD | Embedded images | Dimensions | Estimated decompressed memory |
| --- | ---: | --- | ---: |
| LOD0 | 6 | 512 by 512 | 6,291,456 bytes |
| LOD1 | 3 | 512 by 512 | 3,145,728 bytes |
| LOD2 | 3 | 512 by 512 | 3,145,728 bytes |

All images are embedded in the GLB. There are no external or remote URIs, no
4K textures and no simultaneous PNG/KTX2 runtime package.

## Color Space Contract

- Base color: sRGB.
- Normal and ORM: non-color source data.
- Runtime material mapping assigns Three.js color spaces and anisotropy once
  per loaded asset and does not clone textures each frame.

## KTX2 Gate

`toktx`, `ktx`, `basisu` and `gltf-transform` were not available locally.
`tools/blender/blackcrown-crown/package_candidate_b_ktx2.sh` exits with code 1
and an exact dependency message without downloading or creating fake files.
When KTX-Software is supplied, the wrapper uses ETC1S with mipmaps for base
color/ORM and UASTC with mipmaps for normals. Visual and WebKit validation are
required before a KTX2 manifest can replace the PNG review package.
