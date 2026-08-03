# CROWN//FRONT Web mobile test

Target URL after approved deployment: `https://blackcrown.work/games/crown-front/`
Build: `0.1.0-alpha.1`

No real-device pass is claimed until this checklist is executed on physical hardware.

## Required devices

- Current iPhone with Safari in portrait, including at least one notched/Dynamic Island device.
- One older supported iPhone if available to expose WebGL memory pressure.
- Current Android phone with Chrome in portrait.
- Tablet Safari or Chrome.
- Desktop Chrome/Safari/Firefox/Edge for baseline and console inspection.

Record device model, OS version, browser version, available storage, and whether Low Power Mode is enabled. Do not record personal account data.

## Storefront test

1. Open `https://blackcrown.work/` in a fresh tab.
2. Confirm EvoFish remains visible and still opens `/game/`.
3. Confirm the existing fish lobby opens `/lobby/`.
4. Confirm a second card displays:
   - `CROWN//FRONT`
   - `ALPHA`
   - `Tactical warfare on the body of a living mechanical king.`
   - `PLAY ALPHA`
5. Confirm the cyan/orange preview is sharp and not cropped badly at phone, tablet, and desktop widths.
6. Tap `PLAY ALPHA` once and confirm there is no double navigation.

## Player shell and loading

1. Confirm the route is `/games/crown-front/` and refresh it directly.
2. Confirm the page uses the full available visual viewport rather than a small iframe.
3. Confirm `CROWN//FRONT` and `0.1.0-alpha.1` are visible.
4. Confirm loading percentage moves and the first load completes.
5. Confirm no browser page scroll, rubber-band scroll, or accidental pinch zoom occurs over the game surface.
6. Confirm browser navigation/accessibility outside the game surface remains usable.
7. Toggle airplane mode before loading: expect `YOU ARE OFFLINE` and a working Retry after reconnection.
8. Test an unsupported/disabled WebGL environment if available: expect a friendly browser message, never a stack trace.
9. Under memory pressure, confirm the user sees the friendly memory message if loading fails.

## iPhone Safari specifics

1. Test with Safari address bar expanded and collapsed.
2. Confirm the canvas follows `visualViewport` height without a hidden strip or overflow caused by `100vh`.
3. Confirm Back to Lobby is visible below the notch/Dynamic Island.
4. Confirm the canvas and controls remain above the home indicator.
5. Rotate to landscape: expect `ROTATE TO PORTRAIT`; Back to Lobby must remain available.
6. Rotate back: confirm the canvas resizes once and input remains aligned.
7. Tap the game before expecting audio; confirm no autoplay prompt or audio before a user gesture.
8. Use Fullscreen only from the button. If Safari does not support it, gameplay must remain available without fullscreen.
9. Change tabs or lock the phone during battle: expect the Unity focus guard to pause the battle and audio to suspend.
10. Return to the tab and confirm input is restored without duplicate touches.

## Android Chrome specifics

1. Repeat portrait/landscape, address-bar collapse, safe-area, audio, fullscreen, background, and return tests.
2. Confirm Android back navigation does not leave Unity audio or input running after returning to the storefront.
3. Confirm no browser zoom/scroll competes with one-finger gameplay.

## Gameplay smoke

1. Reach the main menu.
2. Start one battle.
3. Deploy units with one finger in every lane.
4. Use one ability.
5. Pause and resume once.
6. Finish or exit the battle normally.
7. Return to the player page and then use Back to Lobby.
8. Confirm the canvas disappears, audio stops, and the BlackCrown storefront is interactive.
9. Repeat launch → battle → lobby three times while watching memory and audio behavior.

## Network and asset validation

All requests must be HTTPS and return 200:

- `/games/crown-front/`
- `/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.loader.js`
- `/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.data.unityweb`
- `/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.framework.js.unityweb`
- `/games/crown-front/Build/CROWN-FRONT-0.1.0-alpha.1.wasm.unityweb`

Expected MIME types:

- loader: `application/javascript`
- data: `application/octet-stream`
- framework: `application/javascript`
- wasm: `application/wasm`

Expected compression behavior: no `Content-Encoding` for `.unityweb` fallback-wrapper files. The Unity loader performs Brotli fallback decompression.

Expected caching:

- HTML and loader: no-cache/short cache.
- Versioned Unity payloads: one-year immutable cache.

## Result record

For each device, record PASS/FAIL for storefront, route, load, input, audio, rotation, background/return, fullscreen optionality, Back to Lobby cleanup, one complete match, and repeated launch. Attach browser console/network screenshots only if they contain no secrets or personal data.
