# Production Crown slot

No approved production GLB is committed yet. `crown.manifest.json` therefore remains
disabled and Nexus uses the procedural Crown fallback.

Expected files:

```text
lod0/blackcrown-crown-lod0.glb
lod1/blackcrown-crown-lod1.glb
lod2/blackcrown-crown-lod2.glb
textures/                         # only local decoder/runtime support files if required
```

Export against `docs/art/BLACKCROWN_PRODUCTION_CROWN_ASSET_SPEC.md`. Run:

```bash
corepack pnpm --filter @blackcrown/site test:crown-asset
VITE_BC_EXPERIENCE_MODE=lab VITE_BC_EXPERIENCE_DEBUG=1 \
  VITE_BC_CROWN_ASSET_MODE=glb corepack pnpm --filter @blackcrown/site dev
```

Only set `enabled` to `true` after every LOD passes validation and visual review.
To roll back without code changes, set `enabled` to `false`; the route will return to
the procedural backend. Test fixtures belong in tests or temporary output, never here.
