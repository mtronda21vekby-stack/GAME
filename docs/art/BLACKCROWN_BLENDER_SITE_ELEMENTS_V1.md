# BlackCrown Blender Site Elements V1

## Purpose

This pack replaces the weakest procedural environment silhouettes in local
Nexus review without changing the Experience Shell, Crown Candidate A,
Candidate B, or the canonical Crown manifest.

## Contract

- Blender 5.1+ source, generated deterministically from the checked-in script.
- Y-up binary glTF export with local transforms applied.
- No external URLs, linked libraries, textures, cameras, lights, animations,
  skins, or morph targets in exported GLBs.
- Maximum five materials and five primitive draw calls per element.
- Per-element hard limit: 30,000 triangles and 1.5 MiB.
- Black titanium/gunmetal shells remain readable without bloom.
- Cyan is the shared BlackCrown identity; tactical orange is restricted to the
  CROWN//FRONT reactor.

## Elements

### World Gate

Broken arcs, offset containment rails, radial ribs, near shutters and an axial
aperture establish a passage rather than a flat circle.

### CROWN//FRONT Reactor

An authored mechanical cage combines heavy structural ribs, bridge planes,
shutters, a layered aperture and localized tactical-orange energy.

### Network Architecture

An offset command housing and non-identical satellite housings occupy several
depth bands. The asset is a distributed structure rather than a ring of orbs.

### Collection Vault

Three honest display housings correspond to the real catalog categories used by
the DOM layer: skin, badge and bundle. The GLB does not contain fake products,
prices, or purchase controls.

### Identity Frame

Broken profile arcs, sparse data columns, a central identity axis and restrained
crown-like framing complete the final composition without becoming Candidate C.

## Runtime Policy

The manifest remains `enabled: false`. The pack can be requested only from the
local lab/debug experience with `?bcenv=blender`. Missing, invalid, aborted, or
unsupported assets keep the existing procedural scene. Mode-off and ordinary
Home do not fetch the manifest, GLTFLoader, or these GLBs.
