# BLACKCROWN // BREAKOUT

Playable browser vertical slice for the BLACKCROWN prison-sim world.

The app is intentionally isolated under `apps/escape`. The monorepo root toolchain builds it with Vite while the world runtime communicates with the BLACKCROWN lobby through `blackcrown.world.v1`.

## Slice systems

- Three.js isometric 3D prison block
- keyboard and touch movement
- accelerated prison schedule
- four inmate agents
- two guard patrols with vision and suspicion
- restricted maintenance zone
- contraband screwdriver interaction
- power-panel sabotage and service-gate escape
- local snapshot bridge to the lobby

## Root commands

- `pnpm build:escape`
- `pnpm dev:escape`
- `pnpm typecheck:escape`
