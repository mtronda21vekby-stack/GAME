# Quiet Valley / Atelier 0.6.3

## Direction

Preserve the original warm, detailed countryside diorama. The comparison target is
Quiet Valley 0.5.0's authored buildings, separate garden/paddock, pond and market,
not the reduced 0.5.2 Lobby generator. Do not replace the farm with a background
illustration or advertise shader names as an art-quality acceptance.

This release adds actual geometric chamfers, cottage shutters/ivy/lanterns,
recognisable resident outfits, working head animation, pooled chimney smoke,
small butterflies, wood/plaster/roof material treatment and corrected transparent
compositing. Depth polygon offset reduces shadow self-intersection. The phone and
computer use the same assets and material implementation.

The renderer reuses GPU instance allocations and caches hierarchical visibility.
Settings adjust pixel density, shadow resolution and postprocessing, not models.
30 fps mobile and 60 fps desktop are future physical-device performance targets,
NOT measured results of this headless CI. No claim of SSAO, ray tracing, SSR,
photorealism, server-authoritative accounts or a finished AAA game is made.

## Play, not a dashboard

The contextual morning guide points to a real next action: harvest, water, care,
first order, then the production chain. It doesn't lock free play and has no
separate reward counter to farm repeatedly. A ready/dry bed responds directly to
a canvas tap. The animal camera, sound and evening lighting are actually exposed
in the interface. Surplus selling protects all three live orders plus feed;
explicit one-item selling remains the player's choice. Production inputs remain
reserved once and completed output can be claimed once.

## Architecture and asset boundary

`domain/journey.js` is pure guidance/economic queries; `scene/countryDetails.js`
is view-only dressing and fixed-size motion pools. The GLSL lives under rendering,
never in build-time substitutions. Economic commands go through GameSession.
Save keys, four locations, rent policy and platform routes are unchanged.
Procedural geometry remains in this restoration so the old art isn't lost again.
Future external models should use GLB with named pivots, shared materials and
screen-size-appropriate texture/LOD budgets; that import pipeline is not claimed
implemented here.

## Consulted public implementation guides

Read as engineering references, not installed plugins or model training:
- openai/plugins game-studio (routing and coherent scope).
- web-game-foundations (simulation/render/input/save boundaries).
- three-webgl-game (scene adapter, camera ownership, budgeted effects).
- web-3d-asset-pipeline (pivots, material reuse and shipping budgets).
- game-ui-frontend (protect playfield; disclose secondary panels).
- game-playtest (real input and screenshots, not only DOM assertions).
- references/webgl-debugging-and-performance.md (inspect allocation/draw cost).
- MDN WebGL best practices (batching, async shader completion and bounded GPU use).

## Regression corrections

The prior test navigated with reload(), then called boot(), which navigated again.
That canceled module requests in WebKit. Navigation and readiness are separate now;
network failures still fail tests. Crop actions, timed production/storage, region
travel, care/lighting and corrupt-save protection run as independent scenarios.
No timeout is increased to hide the earlier combined-scenario failure.

Review the archived day/evening, close garden/animal, production and four-region
images. Chromium and WebKit are browser engines, not physical iPhone evidence.
The local container could build/test logic, but did not provide a usable WebGL
context; graphical acceptance therefore uses actual CI-served browser pages.
