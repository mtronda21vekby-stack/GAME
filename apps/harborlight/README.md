# Harborlight — Огни бухты

A separate browser 3D traffic-management game. Not a farm, not an EvoFish extension.
Draw or assign shipping routes, avoid collisions, stop vessels, rescue castaways,
use tactical time dilation, and choose upgrades between three watches.

## Play
The `Harborlight.html` distribution is self-contained, including the renderer.
No models, music, or scripts are fetched from a CDN. Open it in a normal browser
on desktop, not an attachment preview. A published HTTPS page is recommended on
phones. All online hosting/deployment must be reported separately from building.

## Develop
Node 20+ and npm. `npm install`, then `npm run dev`. The application is served at
http://127.0.0.1:4173. `npm run build` creates `dist/` plus `Harborlight.html`.
`npm test` checks strict TypeScript domain compilation, boundaries and 29 tests.
`npx playwright install --with-deps chromium webkit` then `npm run test:browser`
checks a real HTTP-served page, not just injected markup.

## Source boundaries
- `src/domain/`: serializable state, maps, seeded scheduling, navigation,
  collision tests, delivery/upgrade/rescue rules; no browser imports.
- `src/application/`: composition, validated domain commands, fixed-step clock,
  pause/visibility ownership, input and run lifecycle.
- `src/rendering/`: Three.js scene, material and water shader factories, batched
  static geometry, ship view objects, route lines; no economic mutations.
- `src/ui/`: DOM presentation, status, help, menus and accessible buttons.
- `src/infrastructure/`: versioned local persistence and optional procedural audio.
- `scripts/`: repeatable build, offline packaging, architectural checks and server.
- `tests/`: deterministic gameplay plus browser acceptance.

Build output is not the source architecture. Editing shaders never requires
changing generated HTML. Three.js r170 is pinned and MIT licensed. All ships,
islands, houses, piers, trees and lighthouse geometry are authored by this project.

## Controls
Tap a ship, then its matching numbered/color-coded port. A safe route around land
is proposed, but other vessels must still be separated by the player. Drag from
a vessel to manually plot its course. Tap open water to reroute a selected boat.
Stop/resume uses the contextual button. Focus: F or the radar button. Pause: Space.
Mouse wheel or +/- changes zoom. SOS: route any ship via the lifeboat then to port.

## Scope
Three distinct maps, three watches per expedition, three vessel classes,
manual/assisted routes, collisions, deadlines, pauses, rescue bonuses, combo scoring,
five inter-watch upgrade options, map unlocks, high scores and saved active runs.
Timers do not advance offline. No purchases, advertising, accounts or servers.
Procedural standard-material lighting plus analytic water waves/foam; not
ray tracing, SSR, a full physics simulator or a claimed AAA production.

Do not overwrite BLACKCROWN production or Quiet Valley to publish this game.
A new hub tile and isolated deployment route are separate integration decisions.
