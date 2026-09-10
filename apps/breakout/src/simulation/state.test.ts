import { describe, expect, it } from "vitest";
import {
  capturePlayer,
  craftServiceShim,
  createInitialSnapshot,
  searchLocker,
  searchWorkshopBin,
  tickSimulation,
  unlockServiceHatch,
} from "./state";
import { scheduleAt } from "./schedule";

describe("breakout simulation", () => {
  it("starts shortly before roll call", () => {
    const state = createInitialSnapshot();
    expect(state.day).toBe(1);
    expect(scheduleAt(state.minuteOfDay).id).toBe("wake");
  });

  it("collects components and crafts a service shim", () => {
    let state = createInitialSnapshot();
    state = searchLocker(state).snapshot;
    state = searchWorkshopBin(state).snapshot;
    const crafted = craftServiceShim(state);
    expect(crafted.ok).toBe(true);
    expect(crafted.snapshot.inventory).toEqual([{ itemId: "service-shim", quantity: 1 }]);
    expect(crafted.snapshot.objectives.find((objective) => objective.id === "craft-service-shim")?.completed).toBe(true);
  });

  it("does not unlock the service hatch without the crafted item", () => {
    const result = unlockServiceHatch(createInitialSnapshot());
    expect(result.ok).toBe(false);
    expect(result.snapshot.flags.serviceHatchUnlocked).toBe(false);
  });

  it("raises suspicion for missing a required schedule zone", () => {
    const state = { ...createInitialSnapshot(), minuteOfDay: 7 * 60 + 31 };
    const next = tickSimulation(state, 5, { playerZone: "corridor", guardCanSeePlayer: true });
    expect(next.stats.suspicion).toBeGreaterThan(state.stats.suspicion);
  });

  it("records roll call attendance when the player is present", () => {
    const state = { ...createInitialSnapshot(), minuteOfDay: 7 * 60 + 31 };
    const next = tickSimulation(state, 1, { playerZone: "roll-call", guardCanSeePlayer: false });
    expect(next.flags.rollCallAttendedToday).toBe(true);
    expect(next.objectives.find((objective) => objective.id === "attend-roll-call")?.completed).toBe(true);
  });

  it("capture resets suspicion but preserves long-term progress", () => {
    const state = searchLocker({ ...createInitialSnapshot(), stats: { ...createInitialSnapshot().stats, suspicion: 100 } }).snapshot;
    const next = capturePlayer(state);
    expect(next.stats.suspicion).toBe(18);
    expect(next.flags.lockerSearched).toBe(true);
    expect(next.capturedCount).toBe(1);
  });
});
