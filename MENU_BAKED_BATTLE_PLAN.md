# CROWN//FRONT Menu + Baked Battle Plan

## Release boundary

- Working branch: `feature/crown-front-menu-and-baked-battle`
- Review version: `0.4.0-menu-baked-review`
- Unity: `6000.5.3f1`
- Production route is protected and is not replaced in this stage.
- Review output is built under `unity/crown-front/Builds/MenuBakedBattleReview/` and uploaded by the pull-request workflow.

## Baseline audit

The shipping project contained one generated scene with one `CrownEngineGame` component. It constructed the arena, gameplay objects, VFX pools and immediate battle HUD at runtime. There was no application state controller, profile model, deck persistence, collection, settings screen, Results-to-menu flow or Unity Test Framework assembly. The public CROWN//FRONT route was approximately 4.9 MiB and its four payload hashes were recorded before work.

Only three playable unit kinds existed: Assault, Tank and Raider. A fourth real `Ranged` UnitDefinition and gameplay presentation were required to satisfy a four-unique-unit deck without visual-only or fake cards. Existing enum ordinals and all existing stats remain unchanged.

## Backed-up files

Backups are stored under `unity/crown-front/Assets/_Project/Backups/PreMenuAndBakedBattle/` with `.backup` extensions so Unity does not compile them:

- `Runtime/CrownEngineGame.cs.backup`
- `Runtime/CrownEnginePresentation.cs.backup`
- `Editor/CrownEngineCloudBuild.cs.backup`
- `Editor/CrownVisualRebirthValidation.cs.backup`
- `Generated/CrownEngine_Prototype.unity.backup`

## Changed and added areas

- Runtime: app data, profile/settings persistence, application flow, uGUI screen construction, baked arena runtime, UnitDefinition assets and existing battle host integration.
- Editor: baked layer generation, authored mesh generation, validation, runtime captures, review WebGL build.
- Generated scene: one application root owning exactly one gameplay root.
- UI: real Unity Canvas and EventSystem; no site CSS controls Unity flow.
- Save/load: optional local profile/settings keys. No existing save ID is removed or rewritten.
- Tests: EditMode and PlayMode assemblies using Unity Test Framework.

## Phases completed

1. Baseline, branch and backup.
2. Profile, deck, settings and deterministic rewards.
3. Central `CrownAppFlowController` and real uGUI screens.
4. Six baked 2.5D Sprite layers and shared authored modular meshes.
5. Dynamic Core, towers, units, projectiles and VFX retained above the baked deck.
6. Editor validation, real Unity captures, tests, 20-transition soak and review WebGL build.
7. Draft pull request only; no merge and no production replacement.

## Protected behavior

Existing Assault/Tank/Raider health, damage, movement speed, attack range, attack interval and energy cost are unchanged. AI cadence and random selection of its original three unit kinds are unchanged. Lane X coordinates, match duration, energy regeneration, Core/tower values, touch-to-lane deployment, targeting and VFX pooling remain intact.

The new Ranged unit is additive because four unique existing definitions are mandatory for a valid deck. It does not modify any existing unit ID or value.
