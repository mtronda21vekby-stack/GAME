# CROWN//FRONT Working Lobby + Baked Battle Report

## Release identity

- Branch: `feature/crown-front-menu-and-baked-battle`
- Draft pull request: created after the local review gate; production merge is explicitly prohibited for this stage.
- Source implementation commit: recorded in the Draft PR and final handoff.
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
- EditMode: 8/8 PASS.
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
- Unity reported payload: 7,110,328 bytes.
- Four WebGL payload files: 7,090,674 bytes combined.
- Artifact directory including template/report/manifest: 8,412 KiB.
- SHA-256 manifest: present.
- Local HTTP: index/loader/data/framework/wasm all returned 200.
- MIME: loader `text/javascript`; fallback `.unityweb` payload `application/vnd.unity` with no incorrect `Content-Encoding`.

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

## Production protection

The four files under `apps/site/public/games/crown-front/Build/` were hashed before work and verified unchanged after the final review build. The public `0.3.0-alpha.3` route remains untouched. The feature branch is submitted as a Draft PR and must not be merged without a separate visual and functional approval.

## Remaining manual checks

- Physical iPhone Safari and Android Chrome.
- Dynamic Island and home-indicator clearance.
- Real touch card selection/deployment and browser background recovery.
- Naturally completed match and long Play Again session.
- Actual compressed texture residency, memory pressure, FPS, 1% low and thermals.
