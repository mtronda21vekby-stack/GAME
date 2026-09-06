# BLACKCROWN Lobby — World Platform Architecture

## Decision

The lobby is the world-selection shell. A game world is not allowed to inject renderer state, global CSS, database credentials or long-running loops into the lobby React tree.

Quiet Valley is integrated as the first isolated world runtime under this contract. EvoFish remains the existing external game app. Future worlds register through the same catalog.

## Layers

```text
BLACKCROWN domain
├── apps/site                 marketing / account / store
├── apps/lobby                world discovery + launch orchestration
│   ├── src/worlds            typed world registry + host UI
│   └── world-runtimes        isolated world sources owned by the lobby build
├── apps/game                 EvoFish runtime
└── packages/*                shared account / UI / commerce primitives
```

Quiet Valley runtime:

```text
world-runtimes/quiet-valley
├── src/simulation.js         deterministic farming state
├── src/expansion.js          regions / construction / upgrades
├── src/gameplay.js           orders / story / characters / rent / weather
├── src/engine.js             WebGL renderer
├── src/models.js             procedural models
├── src/world.js              region composition
├── src/*-ui.js               runtime presentation
├── src/blackcrown-bridge.js  versioned host boundary
└── tests/*.test.cjs          deterministic domain regression suite
```

`build.mjs` emits the single-file runtime to `public/runtime/quiet-valley/index.html` before Vite builds the lobby. The emitted file is a build artifact, not the source of truth.

## World registry

`src/worlds/catalog.ts` is the only lobby-level catalog. Each world declares:

- stable world ID;
- lobby route;
- runtime URL and runtime kind;
- version and maturity;
- preview asset;
- save namespace;
- optional bridge channel;
- current capabilities and roadmap.

Adding another world should not require editing the lobby hero implementation.

## Runtime boundary

Bridge contract: `blackcrown.world.v1`.

Current runtime events:

- `world.ready`
- `world.snapshot`
- `world.leaving`

Current host commands:

- `host.requestSnapshot`
- `host.focus`

Messages are same-origin only. The bridge carries coarse world state, never secrets or privileged database credentials.

## Persistence

Current Quiet Valley persistence is local browser storage under `bc.world.quiet-valley.v1`. Legacy `quiet-valley.v1..v4` saves are accepted for migration.

This is deliberately a port, not the final online authority. The next online milestone must introduce a server-side `FarmRepository`/command boundary with idempotent mutations, server timestamps, account ownership and schema migrations. The renderer must remain unaware of Supabase/service-role credentials.

Recommended future server contract:

```text
Client intent
  -> schema validation
  -> authenticated BLACKCROWN user
  -> farm policy / entitlement
  -> idempotent command
  -> transaction
  -> append audit event
  -> return versioned farm snapshot
```

Do not trust client clocks for crop readiness, rent, market rewards or shared economy once online sync is enabled.

## Multiplayer roadmap

Phase 1 — current: local single-player world, lobby integration, versioned bridge.

Phase 2 — cloud save: signed-in account, optimistic UI with server reconciliation, migration from local save.

Phase 3 — social visits: read-only/limited visitor sessions, presence separated from farm authority.

Phase 4 — player market: server-owned listings and settlement ledger; no peer client can mint currency or inventory.

Phase 5 — seasons/live events: versioned content configuration, rollbackable server flags, analytics and moderation hooks.

## Quality gates

- Quiet Valley deterministic node tests must pass.
- World manifest/catalog/runtime validation must pass.
- Lobby TypeScript must typecheck.
- Production assembly must still emit `/lobby/*` correctly.
- No world runtime may break `/lobby` if WebGL initialization fails.
