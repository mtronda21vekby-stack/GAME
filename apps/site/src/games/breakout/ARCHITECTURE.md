# BLACKCROWN // BREAKOUT

`/games/breakout/` is intentionally a lazy-loaded, full-screen game module inside `apps/site` for the first browser vertical slice. This avoids a new workspace dependency/lockfile surface while keeping the game isolated enough to extract into `apps/breakout` later.

## Boundaries

```text
BreakoutGame.tsx          React composition / HUD
engine/GameRuntime.ts     application loop + orchestration
engine/rendering/*        Three.js only
engine/input/*            keyboard/touch only
simulation/*              deterministic TypeScript, no React/Three/browser storage
persistence/*             save boundary
```

The simulation layer must not import React, Three.js, localStorage, fetch, Supabase, or BLACKCROWN site components.

## Vertical slice contract

The first slice proves:
- isometric 3D movement;
- prison schedule;
- guard patrol/detection;
- compliance/suspicion loop;
- searchable props;
- inventory/crafting;
- restricted service route;
- capture/reset without deleting long-term progress;
- versioned local save;
- keyboard + coarse-pointer controls.

## Extraction path

When BREAKOUT requires independent deployment, workers or a dedicated bundle budget, move this folder to `apps/breakout/src` and keep the same simulation/gameplay contracts. The BLACKCROWN lobby should launch it via URL rather than importing renderer state.

## Online roadmap

Future shared state must be server-authoritative:

```text
client command -> schema -> authenticated user -> world policy
               -> idempotency key -> transaction -> audit event -> snapshot
```

Never trust browser clocks or local inventory for multiplayer economy, escape rankings, purchases, player trading or shared sessions.
