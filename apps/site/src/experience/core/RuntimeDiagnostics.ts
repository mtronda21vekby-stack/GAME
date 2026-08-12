export type RuntimeLifecycleCounters = {
  routeEntryCount: number;
  routeDisposeCount: number;
  rafOwnerCount: number;
};

const counters: RuntimeLifecycleCounters = { routeEntryCount: 0, routeDisposeCount: 0, rafOwnerCount: 0 };

export function recordRuntimeEntry() {
  counters.routeEntryCount += 1;
  counters.rafOwnerCount += 1;
  return { ...counters };
}

export function recordRuntimeDispose() {
  counters.routeDisposeCount += 1;
  counters.rafOwnerCount = Math.max(0, counters.rafOwnerCount - 1);
  return { ...counters };
}

export function getRuntimeLifecycleCounters() {
  return { ...counters };
}
