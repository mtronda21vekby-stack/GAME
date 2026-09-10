import { describe, expect, it } from "vitest";
import { capturePlayer, craftServiceShim, createInitialSnapshot, searchLocker, searchWorkshopBin, tickSimulation, unlockServiceHatch } from "./state";
import { scheduleAt } from "./schedule";
describe("BREAKOUT simulation",()=>{
it("starts before roll call",()=>{const s=createInitialSnapshot();expect(scheduleAt(s.minuteOfDay).id).toBe("wake");});
it("crafts the first route tool from collected components",()=>{let s=createInitialSnapshot();s=searchLocker(s).snapshot;s=searchWorkshopBin(s).snapshot;const r=craftServiceShim(s);expect(r.ok).toBe(true);expect(r.snapshot.inventory).toEqual([{itemId:"service-shim",quantity:1}]);});
it("keeps service hatch locked without the crafted item",()=>{expect(unlockServiceHatch(createInitialSnapshot()).ok).toBe(false);});
it("raises suspicion when mandatory schedule is missed under observation",()=>{const s={...createInitialSnapshot(),minuteOfDay:451};const n=tickSimulation(s,5,{playerZone:"corridor",guardCanSeePlayer:true});expect(n.stats.suspicion).toBeGreaterThan(s.stats.suspicion);});
it("marks roll call attendance",()=>{const s={...createInitialSnapshot(),minuteOfDay:451};const n=tickSimulation(s,1,{playerZone:"roll-call",guardCanSeePlayer:false});expect(n.flags.rollCallAttendedToday).toBe(true);});
it("capture preserves world progress",()=>{const s=searchLocker(createInitialSnapshot()).snapshot;const n=capturePlayer({...s,stats:{...s.stats,suspicion:100}});expect(n.flags.lockerSearched).toBe(true);expect(n.stats.suspicion).toBe(18);expect(n.capturedCount).toBe(1);});
});
