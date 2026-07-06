# EvoFish Custom Skins

This folder is the source folder for EvoFish Next skin assets.

Every skin id from the in-game catalog is linked to an SVG file here through:

```text
apps/game/src/evofish-next/content/skins.ts
```

The public game URL format is:

```text
/game/skins/custom/<skin-id>.svg
```

The current default player fish uses:

```text
/game/skins/custom/default-blue-fish.svg
```

The full mapping is also stored in:

```text
apps/game/public/skins/custom/manifest.json
```

## Current linked skin files

```text
default -> default-blue-fish.svg
neon_koi -> neon_koi.svg
reef_royal -> reef_royal.svg
clown_pop -> clown_pop.svg
angler_glow -> angler_glow.svg
deep_sapphire -> deep_sapphire.svg
gold_scale -> gold_scale.svg
cyber_fish -> cyber_fish.svg
pirate_fish -> pirate_fish.svg
shark_classic -> shark_classic.svg
shark_tiger -> shark_tiger.svg
shark_shadow -> shark_shadow.svg
shark_azure -> shark_azure.svg
shark_white -> shark_white.svg
mega_deep -> mega_deep.svg
mega_bone -> mega_bone.svg
mega_lava -> mega_lava.svg
mega_ice -> mega_ice.svg
mega_nebula -> mega_nebula.svg
```

## How to replace a skin

Replace the matching file with your new asset and keep the same filename.

Example:

```text
apps/game/public/skins/custom/neon_koi.svg
```

## Recommended asset rules

- Transparent background.
- Character faces to the right.
- Keep the whole character inside the canvas.
- Use SVG for easiest GitHub editing, or PNG/WebP when binary upload is available.
- Suggested sprite aspect ratio: about `2:1` for fish and shark, slightly wider for megalodon.
