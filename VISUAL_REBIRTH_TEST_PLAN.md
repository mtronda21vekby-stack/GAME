# CROWN//FRONT Visual Rebirth Test Plan

## Automated and build-time checks

1. Compile the project with Unity `6000.5.3f1` in batch mode.
2. Generate `CrownEngine_Prototype.unity` with the shipping editor method.
3. Run the presentation validation method and fail on missing scripts, missing serialized references, missing visual roots, missing shaders, or forbidden legacy center-UI strings.
4. Run available EditMode and PlayMode tests; if no test assemblies are discovered, record that fact without inventing results.
5. Produce a non-development IL2CPP WebGL build with profiler and script debugging disabled.
6. Verify index, loader, data, framework, wasm, and SHA-256 manifest.
7. Inspect build logs for C# errors and successful inclusion of the CROWN//FRONT presentation shader.

## Gameplay smoke scenario

1. Open the generated scene and start the match.
2. Confirm Blue and Red Core are visible and active.
3. Confirm all six towers are visible.
4. Confirm three lanes are readable without central text overlays.
5. Select Assault, Tank, and Raider cards and deploy each by tapping a lane.
6. Confirm AI deployment continues.
7. Confirm units move, acquire targets, attack, take damage, and die.
8. Confirm towers attack and Core health changes.
9. Complete a match, verify Victory/Defeat, and use Play Again.

## Production checks

- `npm run build:prod` passes.
- `/`, `/game/`, `/lobby/`, and `/games/crown-front/` return HTTP 200.
- Unity files return correct MIME types without incorrect `Content-Encoding`.
- Public payload hashes match the release commit.
- `/game/` and `/lobby/` source files remain unchanged.
- Public shell shows `0.3.0-alpha.3` and contains no CSS canvas mask.

## Manual device checks

- iPhone Safari portrait layout and Dynamic Island safe area.
- Android Chrome portrait layout.
- Touch deployment accuracy and accidental browser gesture behavior.
- Thermal behavior, memory pressure, load time, average FPS, and 1% low FPS.
- Visual readability during a crowded fight and Core destruction.
