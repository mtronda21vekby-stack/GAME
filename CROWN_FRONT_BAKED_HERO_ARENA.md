# CROWN//FRONT — Baked 2.5D Hero Arena

## Decision

The previous procedural and generic CC0 Art Reboot experiments are not release candidates. The next visual slice uses a composed 2.5D arena with baked lighting, authored depth layers and minimal real-time geometry.

Production remains unchanged until a real Unity capture passes visual review.

## Hero-frame target

Portrait 9:16. The battlefield is the armored chest and spine of a colossal mechanical king.

The frame must read in this order:

1. hostile crown/head silhouette at the top;
2. red Core and two integrated weapon towers;
3. broad central combat deck with three readable routes;
4. blue Core and defensive towers at the bottom;
5. compact HUD outside the combat center.

The arena must look authored at thumbnail size. It must not resemble three rectangular lanes, primitive Unity geometry, toy low-poly kits or a generic sci-fi floor.

## Baked layer stack

All source art is portrait and aligned to the same 1080 × 1920 canvas.

| Order | Resource | Purpose |
|---:|---|---|
| 0 | `Arena_Background` | atmosphere, abyss, distant titan mechanisms |
| 10 | `Arena_TitanHull` | main mechanical-king body and large armor masses |
| 20 | `Arena_CombatDeck` | playable deck, three routes and tower/Core sockets |
| 30 | `Arena_Foreground` | near armor, cables and depth occluders |
| 40 | `Arena_LightOverlay` | additive cyan/red/white baked accents |
| 50 | `Arena_MaskOverlay` | subtle lane selection and deployment feedback only |

Runtime units, projectiles, tower heads and Core damage states render between CombatDeck and Foreground.

## Unity resource paths

Place approved PNG assets under:

`unity/crown-front/Assets/Resources/CrownBakedArena/`

Required names:

- `Arena_Background.png`
- `Arena_TitanHull.png`
- `Arena_CombatDeck.png`
- `Arena_Foreground.png`
- `Arena_LightOverlay.png`
- `Arena_MaskOverlay.png`

Importer requirements:

- Texture Type: Sprite (2D and UI)
- Sprite Mode: Single
- Pixels Per Unit: 100
- Alpha Is Transparency: enabled
- Mesh Type: Full Rect
- Mip Maps: disabled
- Wrap Mode: Clamp
- Filter Mode: Bilinear
- WebGL compression: ASTC/ETC2-compatible where available

## Runtime constraints

- Existing gameplay coordinates, AI, lane logic, energy, health, damage and spawn remain unchanged.
- The baked deck is presentation-only and must not add gameplay colliders.
- Units use separate readable 2.5D/3D presentation and remain above the deck.
- The foreground layer may occlude feet and lower machinery but must never hide active combat.
- No large central overlay, PUSH/HOLD/FLANK controls or reactor status banner.
- No CSS mask over the Unity canvas.

## Acceptance gate

Before wiring this pipeline into production, generate and inspect:

1. match start;
2. first clash;
3. Core closeup;
4. grayscale hierarchy;
5. 270 × 480 thumbnail;
6. iPhone safe-area composite.

Reject the slice if any of the following remain true:

- the mechanical king cannot be recognized without explanation;
- the three routes read as plain rectangles;
- Core or towers look like primitive rings/cylinders;
- units collapse into dots;
- the frame is mostly black empty space;
- HUD obstructs combat;
- baked lighting hides deployment positions;
- the visual quality is not clearly above production `0.3.0-alpha.3`.

## Publication policy

This branch is review-only. Do not merge or deploy until the user approves the real Unity hero frame. The current public build at `blackcrown.work/games/crown-front/` must remain untouched during visual development.
