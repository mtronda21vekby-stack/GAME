# EvoFish Custom Skins

This folder is reserved for user-provided EvoFish character skins.

## Current default skin

The current default player fish uses:

```text
/game/skins/custom/default-blue-fish.svg
```

Replace `default-blue-fish.svg` with your own SVG/PNG-compatible asset if you want to swap the default fish without changing game code.

## Recommended asset rules

- Transparent background.
- Fish faces to the right.
- Keep the whole fish inside the canvas.
- Use SVG for easiest GitHub editing, or PNG/WebP when binary upload is available.
- Suggested sprite aspect ratio: about `2:1`.

## Adding more character skins

For now, the default skin is wired directly to `default-blue-fish.svg`.
More custom skins can be added here later and mapped by skin id in the renderer or skin catalog.
