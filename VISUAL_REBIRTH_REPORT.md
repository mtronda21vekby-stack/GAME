# CROWN//FRONT Visual Rebirth Report

## Release identity

- Version: `0.3.0-alpha.3`
- Unity: `6000.5.3f1`
- Branch: `feature/crown-front-visual-rebirth`
- Pull request: `https://github.com/mtronda21vekby-stack/GAME/pull/24`
- Source implementation commit: `cb173637397742c8e387133ab3b1cef452fe9e3e`
- Final PR head: `c014f299f3d0edf25e4f16b7a4a5b6a711e1ebfc`
- Merge commit: `2f750424e1bf86fce48f587f9ed8f4c5e0b1a6cc`
- Production WebGL release commit: `aeb2d89f9797efd9824b8edad88653c04e0c0121`
- PR review build run: `https://github.com/mtronda21vekby-stack/GAME/actions/runs/30876969683` — success
- PR pinned-Unity build run: `https://github.com/mtronda21vekby-stack/GAME/actions/runs/30876969636` — success
- Main production build run: `https://github.com/mtronda21vekby-stack/GAME/actions/runs/30877452710` — success
- Production route: `https://blackcrown.work/games/crown-front/`
- Cloudflare Pages: success for release commit; deployment `2ff1dbc1-0f7b-4f44-aa60-a34c1eea762a`

## Implemented visual direction

The shipping arena is now presented as the exposed armored torso of THE CROWN ENGINE, a colossal mechanical king. The scene uses large graphite armor masses, articulated shoulders and arms, a masked head and crown silhouette, subdeck rotors, hydraulic joints, power spines, deck buttresses, cooling vents, recessed lane conduits, and a central Crown junction. The three gameplay lane coordinates are unchanged.

The visual hierarchy is deliberately constrained to graphite, cold steel, near-black blue, cyan/electric blue, dark red, orange, cold white, and limited brass. There are no imported third-party art or audio assets in this pass.

## Changed Unity content

- Shipping scene: `unity/crown-front/Assets/_Project/Generated/CrownEngine_Prototype.unity`
- Scene generator/build pipeline: `unity/crown-front/Assets/Editor/CrownEngineCloudBuild.cs`
- Runtime presentation/gameplay host: `unity/crown-front/Assets/_Project/Runtime/CrownEngineGame.cs`
- New procedural animation components: `CrownEnginePresentation.cs`
- New WebGL-safe shader: `Resources/CrownEngineSurface.shader`
- New validation/capture tooling: `CrownVisualRebirthValidation.cs`
- Prefabs: none existed and none were introduced; gameplay roots are generated and visual-only children are built beneath them.
- Pre-change source backup: `Assets/_Project/Backups/PreVisualRebirth/` using `.backup` extensions so Unity does not compile the backup.

## Material system

Eleven shared, GPU-instanced opaque materials are created from one `CrownFront/EngineSurface` shader:

1. graphite
2. dark
3. metal
4. armor
5. blue
6. red
7. cyan
8. orange
9. gold
10. white
11. cloud

The shader uses stepped diffuse lighting, restrained rim response, controlled emission, fog support, and Shader Model 2.0. No transparent full-screen materials, Shader Graph, realtime reflection probes, SSAO, motion blur, or depth of field were added.

## Core reactors

Both Core gameplay roots retain the original `3200` health and gameplay component. Their presentation children now include an integrated foundation, armored plinth, team conduit, contained energy chamber, vertical energy column, three independently rotating segmented magnetic rings, four stabilizers, energy slits, and a three-pronged Crown motif. Damage drives local pulse/ring speed, low-health cadence, staged scale/rotation collapse, pooled impact flashes, camera feedback, and Core audio hooks without changing combat timing.

## Tower family

All six towers retain `980` health, `62` damage, `1.2 s` firing interval, lane assignments, and target logic. Visual children now use an embedded socket, armored pedestal, tracking combat module, sloped housing, energy collar, rail cannon, team fins, visible muzzle, recoil, pooled projectile trail, hit flash, and destruction presentation.

## Priority units

- Assault: layered graphite torso, angled shoulder armor, Crown breastplate, team visor, backpack reactor, articulated legs and heavy boots, energy carbine and magazine, forward locomotion lean, recoil and hit response.
- Tank: approximately 42% larger presentation silhouette, wide frontal shield, energy cross, siege cannon, heavy gait, reduced cadence, stronger recoil and impact presentation.
- Raider: leaner silhouette, twin vector thrusters, monomolecular Crown blade, aggressive lean, faster procedural stride, local lunge, rotating compact reactor and restrained short-lived hit effect.

Unit gameplay roots, stats, energy costs, movement speeds, ranges, attack intervals, spawn points, targeting, lane logic, and damage values remain unchanged. Presentation animation never uses root motion or Animation Events.

## VFX, camera, HUD, and audio hooks

- 64 projectiles and 72 impacts are prewarmed and reused; normal shots no longer allocate/destroy their effect objects.
- Projectiles use a white-hot core and a short team-colored opaque trail.
- Impacts use a brief team flash and a rotating armor spark with limited lifetime/overdraw.
- Unit presentation covers spawn flash, locomotion, anticipation/recoil, hit punch, Raider lunge, staged death and scale fade.
- Building presentation covers tracking, muzzle flash, recoil, energy pulse, damage response and staged destruction.
- Camera presentation adds opening settle, subtle breathing, bounded major-impact shake, and result zoom without changing the camera angle or gameplay time scale.
- HUD keeps the center unobstructed, adds safe top spacing, segmented energy, clearer Core status, compact version identity, class role/cost, selected/disabled card states and one-finger deployment guidance.
- Audio hooks exist for UI, deploy, class attacks, towers, impacts, Core states, victory/defeat and titan ambience. No unlicensed clips were added.

## Measured validation evidence

- Unity compilation: PASS on local Unity `6000.5.3f1`.
- Console C# errors: `0` in the final build.
- Final Unity build warnings: `0`.
- Scene generation: PASS; `CrownEngine_Prototype.unity` generated and saved.
- Source/legacy HUD scan: PASS in runtime source.
- Missing serialized components/scripts in generated scene: `0`.
- Runtime presentation smoke: PASS — 8 buildings, 2 opening units, one presentation component per gameplay root, 64 pooled projectiles, 72 pooled impacts, 11 shared materials, exactly 1 realtime light, 277 active renderers at match start, 0 ParticleSystems.
- EditMode tests: no test assemblies existed at audit time; no result is fabricated.
- PlayMode tests: no test assemblies existed at audit time; deterministic runtime presentation smoke checks were added and passed.
- WebGL build: `Succeeded`, IL2CPP, `BuildOptions.None`, errors `0`, warnings `0`.
- Local Unity reported build payload: `5,096,486` bytes.
- Production GitHub Actions Unity payload: `5,098,068` bytes.
- Review artifact directory on disk: approximately `5.8 MiB` including template/report files.
- Installed public game route: approximately `4.9 MiB`.
- Site production build: PASS (`npm run build:prod`).
- Local HTTP: `/`, `/lobby/`, `/game/`, `/games/crown-front/`, loader, data, framework and wasm all returned `200`.
- Local `.unityweb` MIME: `application/vnd.unity`; no incorrect `Content-Encoding` was present and Unity decompression fallback remains enabled.
- Real Unity review frame: `VisualReview/CROWN_FRONT_0.3.0-alpha.3_match-start.png` at 540×960.
- Production HTTP: `/`, `/lobby/`, `/game/`, `/games/crown-front/`, loader, data, framework and wasm returned `200` over HTTP/2.
- Production MIME: loader `application/javascript`, data `application/octet-stream`, framework `application/javascript`, wasm `application/wasm`; no incorrect `Content-Encoding` header.
- Production binary integrity: loader/data/framework/wasm all matched the published `SHA256SUMS.txt`.
- Production shell: version `0.3.0-alpha.3`, references the newly generated `CloudWebGL.*` payload, and contains no legacy center-HUD tokens or CSS mask.
- Cloudflare rewrites the served HTML by injecting its challenge script, so the served `index.html` hash intentionally differs from the source manifest; the unmodified Unity binaries and other shell files match exactly.

The first pinned-Unity PR job built the player successfully but failed while writing its manifest because the Docker output directory was root-owned. The workflow was corrected to return ownership to the runner and exclude the manifest from its own input. The replacement run `30876969636` then passed build, manifest, and artifact upload. No gameplay or presentation code changed for this CI correction.

## Performance notes

- Exactly one realtime Directional Light is used.
- No `ParticleSystem` is required; frequent presentation uses bounded pooled mesh effects.
- All common surface materials enable GPU instancing.
- Small/depth geometry can disable shadow casting; transparent particle overdraw is avoided.
- The baseline public route was approximately `4.8 MiB`; the local rebuilt route is approximately `4.9 MiB`.
- Draw calls, device FPS, 1% low FPS, peak browser memory, and thermal behavior were not measured because this session has no interactive browser runner or physical mobile device. The measured 277 active renderers at match start are a conservative scene-complexity indicator, not a draw-call claim; GPU instancing and batching determine the actual draw-call count.

## Site and compatibility scope

Only `apps/site/public/games/crown-front/` is updated. EvoFish source under `apps/game/` and `apps/lobby/` is unchanged. No CSS mask or canvas overlay was introduced. The removed center controls and legacy reactor messaging are absent from the current runtime source. The existing mobile shell, retry flow, viewport/safe-area handling and Back to Lobby control remain intact.

## Remaining manual checks

- Real iPhone Safari and Android Chrome load, touch deployment and audio unlock.
- Dynamic Island/home-indicator clearance on physical devices.
- Crowded-combat readability, long-session memory and thermal behavior.
- Actual mobile FPS, 1% low FPS and browser peak memory.
- Full match completion and Play Again in the deployed browser build.

These limitations are not presented as passed measurements.
