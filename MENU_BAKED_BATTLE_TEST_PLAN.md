# CROWN//FRONT Menu + Baked Battle Test Plan

## Automated evidence

### EditMode

- A valid deck contains four unique real IDs.
- Unknown IDs are rejected.
- Duplicate IDs are rejected.
- Profile fields survive save/load.
- XP can advance multiple levels correctly.
- A result reward cannot be granted twice.
- Six baked layers are 1080×1920 Sprite assets with mipmaps disabled.
- BuildInfo equals `PlayerSettings.bundleVersion`.

Expected final result: 8/8.

### PlayMode

- Main Menu opens and Deck Builder transition works.
- Valid deck saves and Start Battle launches the existing gameplay session.
- Selected deck appears as four Battle cards.
- Match completion opens Results.
- Return to Menu and Play Again keep one gameplay root.
- Settings persist.

Expected final result: 4/4.

### Flow soak

Run 20 alternating win/loss sessions through Battle → Results → Main Menu. After every cycle verify exactly one gameplay root, one Canvas and one EventSystem.

## Review WebGL smoke

1. Serve `unity/crown-front/Builds/MenuBakedBattleReview/` over HTTP.
2. Verify index, loader, data, framework and wasm return HTTP 200.
3. Confirm loader MIME is JavaScript.
4. `.unityweb` files may use `application/vnd.unity` with no `Content-Encoding` when decompression fallback is active.
5. Verify files against `SHA256SUMS.txt`.
6. Confirm no production route files were replaced.

## Manual visual pass

- Open `VisualReview/MenuBakedBattle/` and inspect every PNG at native size.
- Verify Main Menu controls are legible at 270×480 thumbnail size.
- Verify routes and teams remain distinct in `grayscale.png`.
- Verify Foreground never covers the center clash.
- Verify Core reads as a compact Crown chamber rather than a sphere/ring.
- Verify towers use angular base and twin-rail silhouette.
- Verify Assault, Tank and Raider are distinguishable by mass and weapon.

## Required physical-device checks

- iPhone Safari: Dynamic Island, home indicator, touch deployment, audio unlock, tab background/restore and memory.
- Android Chrome: portrait scaling, touch deployment, quality/FPS settings and memory.
- Run a complete naturally played match, Play Again and Return to Menu.
- Profile 30/60 FPS modes, frame pacing, peak memory and thermal behavior.
- Verify the 47.5 MiB worst-case baked texture allocation is reduced by the actual compressed GPU format.

No physical-device FPS or memory result is claimed by this stage.
