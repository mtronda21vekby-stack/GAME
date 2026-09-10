import { describe, expect, it } from "vitest";
import type { GameSnapshot } from "../domain";
import type { SavePort } from "../persistence/save";
import { BreakoutStore, createFreshSnapshot } from "./BreakoutStore";

class MemorySave implements SavePort {
  value: GameSnapshot | null = null;
  load() { return this.value; }
  save(snapshot: GameSnapshot) { this.value = JSON.parse(JSON.stringify(snapshot)) as GameSnapshot; }
  clear() { this.value = null; }
}

describe("BLACKCROWN Breakout simulation", () => {
  it("can complete the service-line route through gameplay state", () => {
    const save = new MemorySave();
    const store = new BreakoutStore(save);
    const state = store.getSnapshot();
    state.inventory.toothbrush = 1;
    state.inventory.lighter = 1;
    store.craft("plastic-key");
    expect(store.getSnapshot().inventory.plasticKey).toBe(1);
    store.openDoor("service-door");
    expect(store.getSnapshot().openedDoors).toContain("service-door");
    store.getSnapshot().inventory.screwdriver = 1;
    store.interact("maintenance-hatch");
    expect(store.getSnapshot().completedRoute).toBe("maintenance");
  });

  it("keeps hidden contraband when the carried inventory is confiscated", () => {
    const save = new MemorySave();
    const store = new BreakoutStore(save);
    const state = store.getSnapshot();
    state.currentZone = "cellblock";
    state.inventory.file = 2;
    store.stashItem("file", true);
    expect(store.getSnapshot().stash.file).toBe(1);
    for (let i = 0; i < 12; i += 1) {
      store.observePlayer({ x: 12.5, z: -9.2, zone: "maintenance", dt: 1, moving: true, sprinting: false, nearestGuard: 1 });
    }
    expect(store.getSnapshot().inventory.file).toBe(0);
    expect(store.getSnapshot().stash.file).toBe(1);
    expect(store.getSnapshot().currentZone).toBe("cellblock");
  });

  it("blocks a recipe when intelligence is below the requirement", () => {
    const save = new MemorySave();
    save.value = createFreshSnapshot();
    save.value.intelligence = 5;
    save.value.inventory.sheet = 2;
    const store = new BreakoutStore(save);
    store.craft("rope");
    expect(store.getSnapshot().inventory.rope).toBe(0);
    expect(store.getSnapshot().message).toContain("интеллекта");
  });
});
