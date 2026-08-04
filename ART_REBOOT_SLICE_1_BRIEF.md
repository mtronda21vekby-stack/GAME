# CROWN//FRONT — ART REBOOT SLICE 1

## Mission

Create one real, playable Unity hero frame that proves the new art direction before any broader content expansion.

This is not a documentation-only task, mockup task, CSS task or full-game rewrite.

## Source of truth

Implementation must follow `CROWN_FRONT_ART_BIBLE_V2.md`.

## Preserve

Do not change unless explicitly required:

- match rules;
- lane coordinates;
- unit costs;
- health and damage;
- energy regeneration;
- AI decisions;
- spawn logic;
- touch-to-lane deployment;
- EvoFish `/game/` and `/lobby/`;
- current production build until the new slice passes review.

## Required frame

The real Unity screenshot must show:

- portrait 9:16 composition;
- unmistakable mechanical-king anatomy;
- crown/head at the enemy side;
- chest/heart structure at the player side;
- three anatomically distinct routes;
- one authored Blue Core;
- one authored Red Core;
- one authored tower per side;
- one Vanguard Assault;
- one Hostile Crown Assault;
- compact top and bottom HUD;
- no persistent center overlay;
- lighting and materials consistent with the Art Bible.

## Required authored assets

1. Titan structural kit
   - primary armor mass;
   - slanted secondary plates;
   - mechanical insets;
   - energy conduits;
   - shoulder and spine components.

2. Core hero model
   - embedded socket;
   - three stabilizers;
   - concentric rings;
   - central heart;
   - crown motif;
   - healthy and damaged visual states.

3. Tower hero model
   - embedded foundation;
   - directional weapon head;
   - visible muzzle;
   - anticipation and recoil.

4. Assault hero model
   - separate gameplay and visual roots;
   - authored silhouette;
   - rifle-forward pose;
   - idle, locomotion, fire, recoil, hit and death presentation.

5. Material baseline
   - graphite armor;
   - steel edge;
   - deep mechanism;
   - Vanguard armor/energy;
   - Hostile armor/energy;
   - pale insert;
   - white-hot VFX.

## Primitive rejection rule

The slice fails if the dominant visible form of a character, Core or tower still reads as an untouched capsule, cylinder, sphere or cube.

## Evidence package

Generate real Unity captures at the target phone aspect ratio:

- `hero_match_start.png`
- `hero_first_clash.png`
- `hero_core_closeup.png`
- `hero_grayscale.png`
- `hero_thumbnail.png`

No generated concept image may be presented as implementation evidence.

## Technical checks

- Unity 6000.5.3f1 compilation;
- C# errors = 0;
- Missing Scripts = 0;
- serialized missing references = 0;
- scene generation/opening succeeds;
- touch deployment still works;
- AI and combat smoke pass;
- production WebGL review artifact builds;
- Development Build OFF;
- loader/data/framework/wasm present;
- no production deployment before screenshot approval.

## Performance boundaries

- one main directional light;
- ordinary gameplay realtime point lights: zero to two maximum;
- shared material family: target 8–14;
- GPU instancing where supported;
- bounded projectile and impact pools;
- no per-shot material allocation;
- no high-overdraw full-screen effects;
- no FPS claim without physical-device measurement.

## Review decision

Only three outcomes are valid:

- **APPROVED** — proceed to Combat Triangle slice;
- **REVISE** — keep working in the same branch;
- **REJECTED** — do not publish and do not expand the catalogue.

## Next branch

Suggested implementation branch:

`feature/crown-front-art-reboot-hero-frame`

Suggested implementation commit:

`feat: build CROWN FRONT art reboot hero frame`
