# Quiet Valley runtime

Quiet Valley is an isolated BLACKCROWN world runtime. The renderer and simulation are intentionally kept outside the lobby React tree so WebGL, touch handling, styles and save migrations cannot destabilize the lobby shell.

## Boundaries

- `src/simulation.js`, `expansion.js`, `gameplay.js` — deterministic game/domain state.
- `src/engine.js`, `models.js`, `world.js`, `watering.js`, `picking.js` — WebGL presentation/runtime.
- `src/valley-ui.js`, `gameplay-ui.js`, `main.js` — local application/UI orchestration.
- `src/blackcrown-bridge.js` — versioned host/runtime boundary (`blackcrown.world.v1`).
- `build.mjs` — reproducible single-file runtime build emitted into `apps/lobby/public/runtime/quiet-valley/index.html`.

The current save is local and namespaced as `bc.world.quiet-valley.v1`; legacy prototype keys are read for migration. Future cloud saves must be server-authoritative and implemented behind the bridge rather than by giving the WebGL renderer direct database credentials.
