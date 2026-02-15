# BlackCrown Monorepo (Cloudflare Pages)

Monorepo with 3 apps:
- apps/site  — premium Apple-like landing + PWA offline shell
- apps/game  — EvoFish container (NO-CACHE) + settings/fullscreen
- apps/lobby — lobby + 8 players + transparent chat (mock WS)

Shared packages:
- packages/ui     — Button/Modal/Drawer/Tabs/Toast/Toggle
- packages/core   — storage/event bus/feature flags/analytics hooks/ws abstraction
- packages/assets — tokens/themes/icons/manifests

## Requirements
- Node 20+
- pnpm 9+

## Install
```bash
pnpm install
```

## Dev
```bash
pnpm dev:site
pnpm dev:game
pnpm dev:lobby
```

Or all in parallel:
```bash
pnpm dev
```

## Build
```bash
pnpm build:site
pnpm build:game
pnpm build:lobby
```

## Cloudflare Pages
Create 3 Pages projects pointing to the same repo:

### Site
Build command:
pnpm install && pnpm --filter @blackcrown/site build
Output dir:
apps/site/dist

### Game
Build command:
pnpm install && pnpm --filter @blackcrown/game build
Output dir:
apps/game/dist

### Lobby
Build command:
pnpm install && pnpm --filter @blackcrown/lobby build
Output dir:
apps/lobby/dist

## EvoFish integration
Place your existing EvoFish build into:
apps/game/public/evofish/

The container loads:
`/evofish/index.html` in iframe (isolated, no logic break).
