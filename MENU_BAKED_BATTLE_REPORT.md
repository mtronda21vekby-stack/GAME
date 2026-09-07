# CROWN//FRONT Working Lobby + Baked Battle Report

## Release identity

- Branch: `feature/crown-front-menu-and-baked-battle`
- Draft pull request: [#32](https://github.com/mtronda21vekby-stack/GAME/pull/32); production merge is explicitly prohibited for this stage.
- Source implementation commit: `6e22637d885abac741ac4832a14066c8566c1620` (remote review commit; tree SHA `12edaa3ea6a1049237b0d4b2880611d438d2839b` exactly matches the validated local commit tree).
- Unity: `6000.5.3f1`
- Review version: `0.4.0-menu-baked-review`

## Application states

Implemented states: `MainMenu`, `DeckBuilder`, `Collection`, `Battle`, `Results`, `Settings`. `CrownAppFlowController` is the sole transition authority and owns one persistent-in-scene gameplay root.

## Working screens

- Main Menu: real uGUI Canvas, safe-area root, local player/level/XP/coins, baked hero preview, four current deck cards, selected Core, working Battle button and bottom navigation.
- Deck Builder: real UnitDefinition grid, four slots, energy average, duplicate/unknown/locked validation, persistent Save and Back.
- Collection: all four real definitions, unlock state, role, cost, level and description. No fake upgrade button is shown.
- Settings: Master/Music/SFX, vibration hook, VFX intensity, quality, 30/60 cap, reset tutorial and confirmed local-progress reset. Values persist and affect runtime preferences.
- Start Battle: validates deck/Core, saves profile, shows staged loading status, starts the existing battle without page or scene reload and binds the selected four-card deck.
- Results: Victory/Defeat, match duration, surviving Core health, towers, deployment count, available damage metric, deterministic XP/coins, Play Again and Main Menu. Claimed result IDs prevent duplicate reward grants.

Not implemented: shop, real-money purchase, clans, battle pass, events, PvP matchmaking, seasons, server auth, ads, network economy or unit upgrading.

## Save foundation

Two optional local PlayerPrefs JSON records were added: `crown_front.profile.v1` and `crown_front.settings.v1`. Missing optional fields are repaired without deleting an older record. Existing unit enum ordinals remain stable. The newly required Ranged ID is added to the unlocked list without resetting progress.

## Baked arena and presentation

- Six aligned 1080×1920 Sprite layers are present and validated.
- Static atmosphere, titan hull, deck plates, lane architecture, foreground edges, lights and contact masks are baked.
- Core, towers, units, projectiles, impacts and selection/deployment remain dynamic.
- Eight shared authored meshes replace the most obvious Core/tower/unit primitive silhouettes.
- Core uses a compact hex socket, energy lens, three stabilizers and crown blades.
- Towers use embedded angular sockets, tracking housings, twin rails, recoil and team aperture.
- Assault uses a tapered medium torso and carbine silhouette.
- Tank keeps the original stats but uses a wider authored torso, heavy shield and siege cannon.
- Raider keeps the original stats but uses a lean authored torso, vector boosters and crown blade.
- Ranged is a real additive fourth definition with a rangefinder and longline rifle; it exists because a four-unique-unit deck cannot be valid with the original three classes.

## Gameplay change scope

Changed gameplay host: `CrownEngineGame.cs` now supports controlled session start/end, selected deck, summary statistics and additive Ranged spawning. Existing Assault/Tank/Raider values, match time, energy regeneration, lanes, tower values, Core values, target selection, AI cadence and original AI unit selection remain unchanged.

No files under `apps/game/`, `apps/lobby/` or the public CROWN//FRONT payload were changed.

## Validation results

- Unity compilation: PASS.
- C# errors: 0.
- Final Unity build warnings: 0.
- Toolchain emitted informational Emscripten/WebGPU warnings; they did not become Unity build warnings.
- Generated scene: opens and contains one app controller plus one gameplay root.
- Runtime flow smoke: PASS, Menu → Deck → Battle → Results → Menu.
- EditMode: 10/10 PASS, including WebGL runtime UI shader support and Cyrillic menu glyph coverage.
- PlayMode: 4/4 PASS.
- 20-match transition soak: PASS; one gameplay root, one Canvas, one EventSystem after every cycle.
- Missing Scripts: 0 in generated/runtime validation.
- Serialized missing references: 0 in generated/runtime validation.
- Review WebGL: PASS, IL2CPP, `BuildOptions.None`, errors 0, warnings 0.
- Development Build: OFF.
- Script Debugging: OFF.
- Autoconnect Profiler: OFF.

## Review artifact

- Local artifact: `unity/crown-front/Builds/MenuBakedBattleReview/`.
- Unity reported payload after the runtime UI/font correction: 7,372,518 bytes.
- The increase is the embedded 569,208-byte Noto Sans font source before WebGL compression.
- Artifact directory including template/report/manifest: 8,412 KiB.
- SHA-256 manifest: present.
- Local HTTP: index/loader/data/framework/wasm all returned 200.
- MIME: loader `text/javascript`; fallback `.unityweb` payload `application/vnd.unity` with no incorrect `Content-Encoding`.
- GitHub Actions [Build and publish WebGL run 118](https://github.com/mtronda21vekby-stack/GAME/actions/runs/31059320444): PASS; licensing, Unity build, output validation, route assembly and artifact upload passed; `Commit published WebGL` was skipped for the pull request.
- CI review artifact: `crown-front-0.4.0-menu-baked-review-809951db4c746b627d9703c0aaf5c2e6f4dc6746`, 6,941,938-byte ZIP, SHA-256 digest `86f514f803aba1267603133cb580c6e7acc87c66453ebc8d7cfce21ad09b5c8d`.
- GitHub Actions [Unity WebGL cloud build run 129](https://github.com/mtronda21vekby-stack/GAME/actions/runs/31059320617): PASS; licensing, Unity build, SHA-256 generation and artifact upload passed.
- Independent cloud artifact: `crown-engine-webgl-809951db4c746b627d9703c0aaf5c2e6f4dc6746`, 6,951,008-byte ZIP, SHA-256 digest `3017ef225dd910b8c9a8917f484d61c031ff8c1b757f9853b447b17f58daf2ea`.

## Performance scope

- 11 shared GPU-instanced Crown surface materials.
- One shared Sprite material and Unity's shared UI default material.
- One realtime Directional Light.
- Zero ParticleSystems; 64 projectiles and 72 impacts remain pooled.
- Baked PNG source total: approximately 572 KiB.
- Worst-case decoded baked texture upper bound: approximately 47.5 MiB; physical browser GPU format must be profiled.
- Peak unit count observed in the fast transition soak: 2 opening units. This is not presented as a crowded-combat peak.
- Draw calls, FPS, 1% low, browser peak memory and thermals were not measured without a physical device/interactive profiler.

## Captured Unity frames

`VisualReview/MenuBakedBattle/` contains:

- `main_menu.png`
- `deck_builder.png`
- `match_start.png`
- `first_clash.png`
- `core_closeup.png`
- `results_victory.png`
- `results_defeat.png`
- `grayscale.png`
- `thumbnail_270x480.png`
- `iphone_safe_area.png`

These are Unity camera/uGUI renders from the actual runtime hierarchy. They are not generated concept art, HTML screenshots or CSS mockups.

## WebGL runtime UI correction

Manual Safari review exposed a magenta fullscreen fallback that was not detectable from HTTP or compilation checks. The cause was Unity stripping `UI/Default` because every uGUI element is created at runtime. The review branch now assigns one shared `CrownFront/RuntimeUI` WebGL-safe shader to every runtime Graphic. The shader includes Unity Alpha8 font-atlas handling through `_TextureSampleAdd`.

The built-in runtime font also omitted Cyrillic glyphs in WebGL. An unmodified Noto Sans Regular asset is now embedded under the SIL Open Font License 1.1; source, license and SHA-256 are documented beside the asset. Safari visual inspection confirms that Main Menu, `В БОЙ`, `ТЕКУЩАЯ КОЛОДА` and the Russian bottom navigation render without magenta fallback. PlayMode confirms the controlled Start Battle transition independently of browser-coordinate automation.

## Production protection

The four files under `apps/site/public/games/crown-front/Build/` were hashed before work and verified unchanged after the final review build. The public `0.3.0-alpha.3` route remains untouched. The feature branch is submitted as a Draft PR and must not be merged without a separate visual and functional approval.

## Remaining manual checks

- Physical iPhone Safari and Android Chrome.
- Dynamic Island and home-indicator clearance.
- Real touch card selection/deployment and browser background recovery.
- Naturally completed match and long Play Again session.
- Actual compressed texture residency, memory pressure, FPS, 1% low and thermals.
