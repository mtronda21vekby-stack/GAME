# EvoFish Next Architecture

EvoFish Next is the clean rebuild of the current playable EvoFish prototype.

The old one-file game stays alive as the playable fallback. EvoFish Next is built beside it and must preserve the project logic before it replaces the current game.

## Non-negotiable preservation rules

- Preserve the core loop: eat, grow, evolve, fight, collect, unlock.
- Preserve player progression: tier, level, XP, mass, fish -> shark -> megalodon.
- Preserve all skins and skin ownership logic.
- Preserve currencies: pearls and corals.
- Preserve mutations, craft, quests, achievements, NPC families, bosses, biomes and local saves.
- Do not break the current iframe EvoFish while Next is being built.

## Engine direction

EvoFish Next uses a modular browser-first engine layer rather than a single HTML file.

Target architecture:

```txt
evofish-next/
  core/           pure game types and engine contracts
  content/        data-driven skins, forms, NPCs, mutations, quests
  state/          runtime state, save adapters, migrations
  systems/        movement, combat, spawning, progression, economy
  render/         render adapters for skins, VFX, world and HUD
  ui/             React/mobile/PWA shell UI
```

This keeps the current browser/PWA target fast while leaving room to move rendering to PixiJS/Phaser/Godot later if required.

## Migration phases

### Phase 1 — Skins first

Goal: move skins from hardcoded one-file arrays into versioned, data-driven catalog.

Deliverables:

- Skin form types.
- Skin rarity tiers.
- Skin pricing/currency model.
- Skin visual palette and pattern descriptors.
- Save-compatible skin ids.

### Phase 2 — Player forms

Goal: fish, shark and megalodon become explicit forms with body profiles, combat profiles and skin rules.

### Phase 3 — Save compatibility

Goal: old saves can hydrate into Next state without losing owned skins, equipped skin, pearls or corals.

### Phase 4 — Runtime systems

Goal: modular systems for movement, bite, devour, damage, progression, NPC AI and spawning.

### Phase 5 — Render engine

Goal: replace raw drawing logic with a clean render adapter while keeping data intact.

## Version policy

Every gameplay/content update must bump the EvoFish version. Current playable fallback version is tracked in `features/container/evoFishRuntime.ts`. EvoFish Next will have its own version once it becomes runnable.
