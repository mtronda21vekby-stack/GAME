# BLACKCROWN.WORK — CROWN//FRONT integration plan

Date: 2026-08-03
Status: audit complete; no production deployment authorized

## Confirmed projects

- BlackCrown source: the existing local `blackcrown-monorepo` checkout
- Git remote: `https://github.com/mtronda21vekby-stack/GAME.git`
- Current branch at audit: `main`, clean and aligned with `origin/main`
- Unity project: the existing local `CROWN-FRONT` checkout
- Unity WebGL alpha: `Builds/WebGL/CROWN-FRONT-0.1.0-alpha.1/` inside that checkout

No files or routes related to `planetlocksmiths.com` are in scope.

## Site architecture and hosting audit

- Framework: React 18 + TypeScript + Vite 6 monorepo.
- Package manager: pnpm 9.15.4 through Corepack.
- Hosting: Cloudflare Pages, existing project `blackcrown-game`.
- Pages output: root `dist/`, declared by `pages_build_output_dir = "dist"` in `wrangler.toml`.
- Production assembly: `npm run build:prod`, which builds `apps/site`, `apps/game`, and `apps/lobby`, then runs `scripts/assemble.mjs`.
- Existing production deploy: GitHub Actions runs `wrangler pages deploy dist --project-name=blackcrown-game --branch=main` inside `.github/workflows/auto-deploy-cloudflare-pages.yml` after a push/merge to `main`, when the repository Cloudflare secrets are configured. This command is owned by CI and will not be invoked directly from the local session.
- Local preview command: `corepack pnpm exec wrangler pages dev dist` after `npm run build:prod`.
- Public site at audit returned HTTP 200 from Cloudflare for `/`, `/game/`, and `/lobby/`.

## Existing product routes

- `/` — BlackCrown platform storefront and launcher. This is the correct game-selection surface.
- `/game/` — EvoFish game application.
- `/lobby/` — EvoFish-specific lobby, loadout, fish selection, and mode selection.
- EvoFish currently also owns static content beneath `/game/evofish/`.

The EvoFish source, build inputs, public assets, and routes will not be modified. The new title will be added beside it from the root platform storefront.

## Current redirects and headers

`scripts/assemble.mjs` currently emits SPA fallbacks for `/game/*`, `/lobby/*`, then root `/*`. It also emits shared security/cache headers and forces `/game/*` to `no-store`.

Required changes:

- Add an explicit static route for `/games/crown-front/` before the root SPA fallback so deep links resolve to the Unity shell.
- Preserve `/game/*` and `/lobby/*` exactly.
- Add MIME and cache rules scoped only to `/games/crown-front/*`.
- Do not enable COOP/COEP or WebAssembly threads for CROWN//FRONT because the verified build does not require them.

## Current build sizes

- Existing assembled `dist/`: about 31,236 KiB on disk.
- `apps/site/dist`: about 2,032 KiB.
- `apps/game/dist`: about 33,024 KiB.
- `apps/lobby/dist`: about 19,304 KiB.
- Verified CROWN//FRONT source build: about 8,432 KiB on disk (8.2 MiB).

The final upload size will be measured after a clean production build. The Unity addition should increase the assembled output by approximately the verified 8.2 MiB plus a small original preview image.

## Unity build audit

Build version: `0.1.0-alpha.1`.

Verified required files:

- `index.html`
- `Build/CROWN-FRONT-0.1.0-alpha.1.loader.js`
- `Build/CROWN-FRONT-0.1.0-alpha.1.data.unityweb`
- `Build/CROWN-FRONT-0.1.0-alpha.1.framework.js.unityweb`
- `Build/CROWN-FRONT-0.1.0-alpha.1.wasm.unityweb`
- `TemplateData/style.css`

The `.unityweb` payloads use Unity's `UnityWeb Compressed Content (brotli)` fallback wrapper. They are not ordinary server-side `.br` files, so they must be served with the content types expected by Unity and **without** `Content-Encoding: br`; the shipped Unity loader performs the fallback decompression. The uncompressed loader JavaScript and HTML also receive no content encoding.

## Planned site changes

1. Create Git branch `feature/crown-front-alpha`.
2. Back up every source file that will be changed to `Backups/PreCrownFrontLobbyIntegration/`, preserving relative paths and excluding dependencies/caches/build output.
3. Add an original, locally authored CROWN//FRONT preview graphic under `apps/site/public/assets/games/crown-front/`.
4. Add a second game card on the root BlackCrown storefront:
   - `CROWN//FRONT`
   - `ALPHA`
   - `Tactical warfare on the body of a living mechanical king.`
   - `PLAY ALPHA`
   - route `/games/crown-front/`
5. Leave the existing EvoFish route, application, lobby, and assets unchanged.
6. Copy the verified Unity build as static assets under a source-controlled public/static input, preserving `Build/` and `TemplateData/` names.
7. Upgrade only the copied Unity shell for BlackCrown hosting:
   - full visual viewport canvas;
   - safe areas and `100dvh`/visual viewport fallback;
   - loading progress, Retry, offline/unsupported/OOM messaging;
   - portrait rotation guidance;
   - user-gesture-only fullscreen and audio activation;
   - visibility pause/resume hooks when supported by the Unity bridge;
   - reliable Back to Lobby with `Quit()`, listener/canvas/audio cleanup, and fallback navigation.
8. Extend `scripts/assemble.mjs` to copy that static route after app builds and emit route-specific redirects/headers.
9. Build locally, serve through the Cloudflare Pages local runtime, and run HTTP/browser smoke checks.
10. Produce the requested report, rollback guide, and mobile test document with measured results.
11. Create the requested local commit on `feature/crown-front-alpha`, then stop before any push and present the exact status, changed files, route, measured upload size, checks, and risks.
12. After a separate explicit confirmation, push only `feature/crown-front-alpha` to the existing `origin` GitHub repository and prepare a pull request if that is the repository flow.
13. Do not merge the pull request without another explicit confirmation. Production deployment occurs only when the existing GitHub Actions workflow observes the approved push/merge to the production branch.
14. Monitor the GitHub Actions run and verify public routes/headers after that existing pipeline succeeds.

Direct Wrangler deploy, Cloudflare Dashboard upload, Pages upload, Workers deploy, FTP, SCP, manual asset upload, DNS changes, workflow secret changes, force push, and history rewriting are prohibited.

## Expected URLs

- Lobby/storefront: `https://blackcrown.work/`
- Existing EvoFish: `https://blackcrown.work/game/`
- Existing EvoFish lobby: `https://blackcrown.work/lobby/`
- CROWN//FRONT alpha: `https://blackcrown.work/games/crown-front/`

## Planned cache and MIME policy

- `/games/crown-front/index.html`: `no-cache`.
- Unity loader shell/loader JS: short cache or `no-cache` so releases can update safely.
- Versioned Unity `.data.unityweb`, `.framework.js.unityweb`, `.wasm.unityweb`: long immutable cache.
- `.wasm.unityweb`: `application/wasm`, without `Content-Encoding` because the Unity fallback wrapper is not a raw `.br` response.
- `.framework.js.unityweb`: `application/javascript`, without `Content-Encoding` for the same reason.
- `.data.unityweb`: `application/octet-stream`, without `Content-Encoding` for the same reason.
- `.loader.js`: `application/javascript`, without Brotli content encoding.
- JSON: `application/json`.

## Verification gates before deployment

- TypeScript checks for all existing applications.
- Clean Vite production builds and assembled Pages output.
- Existing EvoFish source inputs unchanged and `/game/` plus `/lobby/` return 200.
- CROWN//FRONT shell, loader, data, framework, and wasm return 200.
- MIME, Brotli, and cache headers match payload types.
- Root card opens the correct independent route.
- Deep-link refresh works.
- Back to Lobby works even if Unity load or `Quit()` fails.
- No integration errors in the browser console.
- Desktop and responsive viewport checks, including portrait and landscape warning.
- SHA-256 verification of copied Unity payloads.

Real iPhone/Android gameplay, memory pressure, audio unlock, Dynamic Island, home indicator, and long-session thermal behavior remain mandatory manual-device checks unless a real device is connected during this stage.

## Main risks

- iOS Safari memory pressure: the approximately 8.2 MiB compressed download expands substantially in memory at runtime.
- Incorrect Cloudflare `Content-Encoding` can make Unity decompression fail; header tests are mandatory.
- A broad SPA fallback could return HTML for a missing Unity binary; tests must validate status, MIME, and file signatures.
- Unity `Quit()` behavior differs by browser; navigation needs a timeout/fallback.
- Service-worker caches from the existing site/game can obscure updates if the new route is accidentally brought under their scope.
- Pushing or deploying before explicit confirmation is prohibited.
