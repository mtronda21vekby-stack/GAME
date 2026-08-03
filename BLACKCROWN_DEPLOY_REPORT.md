# BLACKCROWN.WORK deployment report

Date: 2026-08-03
Release: CROWN//FRONT `0.1.0-alpha.1`
State: feature branch pushed; pull request, merge, and production deployment pending

## Repository and delivery path

- Local repository: existing `blackcrown-monorepo` checkout
- GitHub repository: `mtronda21vekby-stack/GAME`
- Remote: `https://github.com/mtronda21vekby-stack/GAME.git`
- Integration branch: `feature/crown-front-alpha`
- Production branch: `main`
- Hosting: existing Cloudflare Pages project `blackcrown-game`
- Production workflow: `.github/workflows/auto-deploy-cloudflare-pages.yml`
- Workflow trigger: push to `main` for the configured application/source paths
- Workflow build: `pnpm install --frozen-lockfile`, then `pnpm build:prod`
- Workflow deploy: Cloudflare Wrangler action inside GitHub Actions; no local/direct deployment is allowed
- GitHub App check: repository exists, default branch is `main`, and the connected account reports push/admin access.

The local `gh` CLI is not installed. No token, password, SSH key, Keychain entry, Actions secret, or environment secret was read or printed.

## Public routes

- BlackCrown storefront: `https://blackcrown.work/`
- Existing EvoFish: `https://blackcrown.work/game/`
- Existing EvoFish lobby: `https://blackcrown.work/lobby/`
- CROWN//FRONT target: `https://blackcrown.work/games/crown-front/`

At audit time, the three existing public routes returned HTTP 200 from Cloudflare. The CROWN//FRONT URL is intentionally not public yet.

## Integration completed

- Added a second storefront card with the required title, ALPHA status, description, and `PLAY ALPHA` action.
- Reframed the existing generic game card as EvoFish while preserving `/game/`.
- Added an original code-authored SVG preview with cyan/orange sci-fi accents; no external or copied artwork is used.
- Added the verified Unity WebGL alpha under `apps/site/public/games/crown-front/` as static assets, outside the site JavaScript bundle.
- Preserved the original `Build/` and `TemplateData/` structure and all Unity payload names.
- Confirmed copied Unity payload hashes are identical to the source build at `Builds/WebGL/CROWN-FRONT-0.1.0-alpha.1/` in the local Unity checkout.
- Added a full-route player shell with loading progress, version, Retry, offline/unsupported/memory errors, optional fullscreen, portrait guidance, visual viewport sizing, safe areas, gesture-scoped scroll/zoom prevention, audio unlock on user interaction, background audio suspension, and Back to Lobby.
- Back to Lobby attempts `UnityInstance.Quit()`, waits with a safe timeout, removes listeners/script/canvas, suspends/closes the Unity audio context when possible, and navigates to `/` even if cleanup fails.
- No source files in `apps/game` or `apps/lobby` were changed.

## Changed source and shipping files

- `BLACKCROWN_DEPLOY_PLAN.md`
- `BLACKCROWN_DEPLOY_REPORT.md`
- `BLACKCROWN_ROLLBACK.md`
- `CROWN_FRONT_WEB_MOBILE_TEST.md`
- `Backups/PreCrownFrontLobbyIntegration/apps/site/src/routes/Home.tsx`
- `Backups/PreCrownFrontLobbyIntegration/apps/site/src/styles/site.css`
- `Backups/PreCrownFrontLobbyIntegration/apps/site/public/_headers`
- `Backups/PreCrownFrontLobbyIntegration/apps/site/public/_redirects`
- `Backups/PreCrownFrontLobbyIntegration/scripts/assemble.mjs`
- `apps/site/src/routes/Home.tsx`
- `apps/site/src/styles/site.css`
- `apps/site/public/assets/games/crown-front/crown-front-preview.svg`
- `apps/site/public/games/crown-front/index.html`
- `apps/site/public/games/crown-front/TemplateData/style.css`
- `apps/site/public/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.loader.js`
- `apps/site/public/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.data.unityweb`
- `apps/site/public/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.framework.js.unityweb`
- `apps/site/public/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.wasm.unityweb`
- `apps/site/public/games/crown-front/README_ALPHA.md`
- `apps/site/public/games/crown-front/SHA256SUMS.txt`
- `scripts/assemble.mjs`

Generated `dist/`, `node_modules`, Wrangler caches, and temporary render/check files are not included in the change set.

## Production output size

- CROWN//FRONT route: `8,504,744` bytes (`8.11 MiB`).
- Full locally assembled `dist/`: `63,763,163` bytes (`60.81 MiB`).
- Unity source folder on disk: about `8,432 KiB`.

These are exact local file-byte totals for the current production assembly. Cloudflare upload transfer size and CDN storage accounting may differ.

## MIME, compression, and cache policy

| Asset | Content-Type | Content-Encoding | Cache-Control |
|---|---|---|---|
| player `index.html` | `text/html; charset=utf-8` | none | `no-cache` |
| loader `.js` | `application/javascript; charset=utf-8` | none | `no-cache` |
| `.data.unityweb` | `application/octet-stream` | none | `public, max-age=31536000, immutable` |
| `.framework.js.unityweb` | `application/javascript` | none | `public, max-age=31536000, immutable` |
| `.wasm.unityweb` | `application/wasm` | none | `public, max-age=31536000, immutable` |
| `TemplateData/*` | inferred static type | none | `public, max-age=3600` |

No `Content-Encoding: br` is set intentionally. These `.unityweb` files begin with Unity's `UnityWeb Compressed Content (brotli)` fallback wrapper rather than being ordinary server-side `.br` payloads. The verified loader contains the matching worker decompressor. Applying a raw Brotli response header to this wrapper could break browser loading, particularly on Safari.

No SharedArrayBuffer, COOP/COEP, WebAssembly threads, DNS, Cloudflare project, or build-provider changes were introduced.

## Local verification results

| Check | Result | Evidence / note |
|---|---|---|
| Git remote / branch / workflow | PASS | Existing `origin`, feature branch, `main` trigger, existing Pages project confirmed |
| Production Vite build | PASS | Site, game, and lobby built; `npm run build:prod` completed |
| Production assembly | PASS | Root, `/game/`, `/lobby/`, and `/games/crown-front/` assembled |
| Lint command | PASS | Existing workspace lint scripts exited 0; note they are configured as no-op scripts |
| TypeScript workspace check | PRE-EXISTING FAILURES | Existing site errors remain in MatrixBackground, RouteMotion, Roadmap, xpClient, duplicate legacy router/pages, HomeBlocks, Account, Store, Privacy, Support, and Terms. Integration-specific Home callback errors were removed. |
| Shell JavaScript syntax | PASS | Inline player script parsed with Node `new Function` |
| Card in production bundle | PASS | Required title, action, and route present in built site JavaScript |
| Unity source/copy integrity | PASS | All four Build payload SHA-256 values match the Unity source build |
| Local root route | PASS | HTTP 200 |
| Local `/game/` | PASS | HTTP 200; no EvoFish source modifications |
| Local `/lobby/` | PASS | HTTP 200; no EvoFish lobby source modifications |
| Local CROWN//FRONT route | PASS | HTTP 200 and HTML MIME |
| Loader / data / framework / wasm | PASS | All HTTP 200 with expected MIME types |
| Cache headers | PASS locally | Versioned Unity payloads return long immutable cache; shell/loader are no-cache |
| Unity fallback compression | PASS static/protocol | Wrapper marker and matching loader decompressor confirmed; no invalid Content-Encoding |
| Original preview render | PASS | SVG rendered successfully for visual inspection |
| Interactive browser smoke | NOT AVAILABLE | No controllable browser is connected to this session |
| Real iPhone/Android gameplay | MANUAL REQUIRED | Not claimed as tested |
| GitHub feature push | PASS | `feature/crown-front-alpha` is present on the existing `origin` |
| Pull request / Actions | PENDING | PR not created yet; production workflow has not started |
| Public CROWN//FRONT URL | PENDING DEPLOYMENT | Must remain unavailable until approved GitHub flow completes |

The installed local Wrangler 3 preview reports the repository's three existing SPA fallback rules as possible infinite loops. Those rules predate this integration and were not changed; static root, EvoFish, lobby, and CROWN//FRONT directory routes all returned 200. GitHub CI uses `cloudflare/wrangler-action@v3`; this warning should be reviewed separately but is not caused by the new game route.

## Commit and deployment record

- Required local commit message: `feat: add CROWN FRONT WebGL alpha to game lobby`
- Local commit SHA: recorded in the handoff after commit; the final deployed SHA will be added here after the approved PR/merge.
- Feature branch push: completed through the existing GitHub remote.
- Pull request: not created.
- GitHub Actions run: not started.
- Cloudflare production deployment: not started.

Production is complete only after explicit push approval, an approved merge to `main`, successful existing GitHub Actions run, and public smoke verification.

## Remaining manual gates

- Review storefront and player shell in a real browser at desktop, iPhone portrait, Android portrait, tablet, and landscape sizes.
- Confirm card click and Back to Lobby interaction.
- Complete one real match on iOS Safari and Android Chrome.
- Verify notch, Dynamic Island, home indicator, audio unlock, optional fullscreen, background/return, memory behavior, and repeated loads.
- After approved production deployment, repeat HTTP and cache checks against `https://blackcrown.work` and record the Actions run URL and deployed commit SHA.
