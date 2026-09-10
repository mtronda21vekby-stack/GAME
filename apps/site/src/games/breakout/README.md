# BLACKCROWN // BREAKOUT

Browser-first isometric prison-escape game prototype embedded as a lazy BLACKCROWN site route.

## Architecture

- `engine/` — Three.js rendering, camera, input, collisions and world interaction bridge.
- `world/` — data-driven prison blueprint, rooms, doors, schedules and NPC catalog.
- `simulation/` — deterministic game state, daily clock, suspicion, economy and escape rules.
- `gameplay/` — items and crafting recipes.
- `persistence/` — save port boundary; localStorage is the current adapter and can later be swapped for cloud saves.
- `ui/` — React HUD, inventory, crafting, relationships and escape planning.

The renderer never owns progression. It observes `BreakoutStore` and sends interaction/observation commands. This boundary is intentional so a future server-authoritative economy, shared BLACKCROWN identity, multiplayer visits, analytics or native shell can be added without rewriting the game rules.

## Vertical slice 0.1

- Procedural 3D prison with Block C, canteen, laundry, gym, medical wing, yard, maintenance and rooftop service area.
- Keyboard, click-to-move and touch controls.
- Daily schedule with compliance pressure.
- Prisoner and guard NPC schedules/patrols.
- Suspicion, capture and contraband confiscation.
- Inventory, cell stash and local save.
- Laundry job, money, strength and intelligence progression.
- Rook trader, Marco deal, Nico uniform, Miller bribe and Dr. Hayes healing.
- Three escape plans: maintenance, roof and tunnel.
- 12 items and 3 crafting recipes.

## Production direction

The current version is intentionally asset-light. Replace procedural people and rooms with authored low-poly assets later without changing simulation contracts. Before online economy is enabled, move money, item acquisition and escape progression to a server-authoritative API.
