# CROWN//FRONT Baked Arena Layer Specification

## Source assets

All layers are authored by the project editor generator and committed as real Unity Sprite assets under `unity/crown-front/Assets/Resources/CrownBakedArena/`:

1. `Arena_Background.png` — opaque atmospheric depth and distant Crown silhouette.
2. `Arena_TitanHull.png` — shoulders, ribs, mechanical head and crown body.
3. `Arena_CombatDeck.png` — aligned armored play surface and three architectural routes.
4. `Arena_Foreground.png` — restricted edge armor and cables; the combat center stays transparent.
5. `Arena_LightOverlay.png` — restrained blue/red conduits and objective glow.
6. `Arena_MaskOverlay.png` — contact shadows at Core and tower sockets.

Every file is 1080×1920, has the same pivot/alignment and contains no text, buttons or HUD.

## Import settings

- Texture Type: Sprite, Single.
- Pixels Per Unit: 100.
- Max size: 2048.
- Mipmaps: disabled.
- Wrap mode: Clamp.
- Filter: Bilinear.
- Compression: Compressed HQ with crunch quality 82.
- Alpha-is-transparency: enabled for non-background layers.

## Runtime depth order

```text
Background
TitanHull
CombatDeck
dynamic gameplay roots
Foreground edge cutouts
LightOverlay
MaskOverlay/contact shadows
Battle HUD
```

The baked layers do not own colliders, navigation, targeting or touch zones. Existing gameplay lane coordinates remain `-4.4`, `0`, `4.4`. Dynamic Core, towers, units, projectiles, hit effects and health state remain real Unity objects above the deck.

## Perspective and composition

- Image bottom corresponds to the Blue side and image top to the Red side.
- The mechanical king head and crown anchor the upper silhouette.
- The three routes use different plate shapes and split team conduits instead of textual or solid rectangular lane labels.
- The central Crown junction remains open for clashes.
- Side armor and cables frame the field without crossing the unit corridor.

## Memory and build impact

- Source PNG files: approximately 572 KiB total.
- Worst-case fully decoded RGBA32 upper bound: `6 × 1080 × 1920 × 4 = 49,766,400 bytes`, approximately 47.5 MiB.
- Actual GPU allocation depends on browser/device-supported compressed texture format; it must be profiled on physical iPhone and Android hardware.
- Final review WebGL data payload: 1,350,113 bytes.
- No mip chain is allocated.
- Six renderers share Unity's Sprite material; no per-layer material instances are created.

## Authored dynamic mesh library

Eight shared mesh assets under `Resources/CrownMeshes` replace the most visible built-in primitive silhouettes: tapered torso, armor wedge, angular helmet, heavy shield, hex socket, energy lens, crown blade and rail housing. They are reused by Core, tower, Assault, Tank, Raider and Ranged presentation children.
