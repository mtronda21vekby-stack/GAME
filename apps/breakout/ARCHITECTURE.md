# BLACKCROWN // BREAKOUT — Architecture

## Product boundary

`apps/breakout` is a standalone browser game mounted at `/games/breakout/`. It may be launched from the BLACKCROWN games hub/lobby, but it owns its renderer, simulation loop, input, save data and UI.

The site/lobby must never own prison simulation state. The renderer must never mutate persistence directly. Future backend work must sit behind explicit repository/command interfaces.

## Layers

```text
src/
├── app/                 React composition + HUD only
├── engine/              imperative runtime shell
│   ├── rendering/       Three.js scene/camera/materials
│   └── input/           keyboard/touch abstraction
├── simulation/          deterministic clock, schedule and suspicion rules
├── gameplay/            inventory, crafting, interactions and escape objectives
├── persistence/         versioned save repository
└── ui/                  presentational components
```

Dependency direction:

```text
UI -> application/runtime -> simulation/gameplay
renderer -> readonly runtime snapshot
persistence -> serialized domain snapshot
simulation/gameplay -X-> React / Three.js / localStorage / network
```

## Current vertical slice

- isometric 3D prison block;
- accelerated daily schedule;
- player movement;
- guard patrol and detection;
- roll-call compliance and suspicion;
- searchable world props;
- inventory + one crafting recipe;
- restricted maintenance route;
- capture/reset loop;
- versioned local save.

## Future online boundary

Do not trust client state for multiplayer/economy. Planned command flow:

```text
client intent
  -> schema validation
  -> authenticated BLACKCROWN identity
  -> prison/world policy
  -> idempotent command
  -> server transaction
  -> append audit event
  -> versioned snapshot
```

Potential services are hidden behind interfaces such as `SaveRepository`, `SessionRepository`, `WorldCommandGateway` and `PresenceGateway`.

## Quality gates

A change is not considered complete unless:

1. `pnpm --filter @blackcrown/breakout typecheck` passes;
2. `pnpm --filter @blackcrown/breakout test` passes;
3. `pnpm --filter @blackcrown/breakout build` passes;
4. production assembly still serves `/games/breakout/` independently of `/`, `/lobby/`, `/game/` and `/games/quiet-valley/`;
5. a renderer failure cannot break the BLACKCROWN lobby.
