# Candidate B Local Review Slot

These GLBs are deterministic local review assets, not the approved production
Crown. The canonical `../crown.manifest.json` remains disabled.

Candidate B is reachable only in Nexus Lab debug mode through:

```text
VITE_BC_CROWN_ASSET_OVERRIDE=candidate-b
?nexuscrown=candidate-b
```

Validation:

```bash
corepack pnpm --filter @blackcrown/site test:crown-asset -- --candidate candidate-b
```

Any load, validation or binding failure must return to the procedural Crown.
