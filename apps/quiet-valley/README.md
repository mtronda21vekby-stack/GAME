# Quiet Valley · restored standalone application

This is the source of `/games/quiet-valley/`, not another inline HTML game and not an EvoFish feature.

## Run
From the repository root after `pnpm install --frozen-lockfile`:

```sh
pnpm --filter @blackcrown/quiet-valley dev
pnpm --filter @blackcrown/quiet-valley test
pnpm --filter @blackcrown/quiet-valley typecheck
npm run build:prod
```

Open the local server at `/games/quiet-valley/`. Do not double-click the HTML: it loads ES modules.

## Ownership and direction
`app/startGame.js` is the browser composition root. `application/GameSession` is the sole state writer. UI and scene observe frozen snapshots and submit validated commands; rejected commands mutate only a discarded candidate.

`domain/` contains per-session farming, expansion, story and production factories. No DOM, browser storage, network, renderer or shared global simulation. Clock comes through a port. Timers and currencies are still **local**, not trusted online balances.

`rendering/` owns math, instanced geometry, GPU resources, shader programs and quality settings. `scene/` owns the restored detailed farm, four regions and animated models. All devices use the same materials and geometry. Quality settings change resolution/effect cost, not the art. Shader source modules are copied unchanged; no build-time search-and-replace program patches.

`presentation/` owns HUD/labels/templates; `input/` owns camera and action mapping. `app/controller.js` coordinates the existing interaction lifecycle; it is deliberately not a repository or renderer. These restored procedural/UI modules remain JavaScript. Ports, command parsing, session and persistence are strict TypeScript; claiming the entire art stack is strictly typed would be incorrect.

`infrastructure/` implements local storage, preferences, resource lifetime and a read-only BLACKCROWN bridge. Every owned listener/timer/GPU resource has teardown. Origin/source/channel checks guard bridge messages. No arbitrary host commands or credentials are accepted.

## Migration / rollback
Keep `bc.world.quiet-valley.v1`. Read legacy `quiet-valley.v1` through `v4`. Before migration, retain the exact original string at `.backup-before-restored`. Invalid or newer unknown saves stay untouched; a temporary farm cannot autosave over them. Export/import is available in settings. The saved JSON farm shape remains version 4 and compatible with the old local farm; production fields are an additive extension.

Cross-tab byte checks prevent an obvious stale tab overwrite. They are not a database transaction or multiplayer authority. Request-ID deduplication is session-local only. No account, cloud sync or multiplayer server is implemented here.

## Build / delivery
The app builds its own `dist/`: a small HTML shell plus `assets/<source-hash>/` ES modules and CSS and a release manifest. BLACKCROWN assembly copies this dist directly. Lobby no longer compiles the farm as part of its build. The legacy `apps/lobby/world-runtimes` sources are retained for compatibility tests, not used for the published game.

CI checks module boundaries, TypeScript, deterministic domain/transaction/migration tests, **served-page** Chromium and WebKit gameplay, first-frame/shadow state, real storage reload, four region screenshots and the production site package. A deployment probe fetches the release manifest and traverses every imported JS module with MIME checks. HTTP and emulated-WebKit tests are not physical iPhone acceptance.

## Visual acceptance
Restored from the pre-integration game: separate animal paddock and vegetable beds; articulated animals, cottage window boxes, awnings, windmill sails, paths, ponds/ducks and layered terrain. Capture screenshots with the actual renderer. A ready flag or a count of tests does not establish visual quality.
