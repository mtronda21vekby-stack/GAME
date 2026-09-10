import type { GameSnapshot } from "./simulation/model";

const CHANNEL = "blackcrown.world.v1" as const;
const WORLD_ID = "breakout" as const;
const VERSION = "0.1.0" as const;

type HostMessage = {
  channel: typeof CHANNEL;
  worldId: typeof WORLD_ID;
  type: "host.requestSnapshot" | "host.focus";
};

function post(type: "world.ready" | "world.snapshot" | "world.leaving", payload: Record<string, unknown> | null): void {
  if (window.parent === window) return;
  window.parent.postMessage(
    { channel: CHANNEL, worldId: WORLD_ID, version: VERSION, type, payload, at: Date.now() },
    window.location.origin,
  );
}

export function installWorldBridge(getSnapshot: () => GameSnapshot): () => void {
  const sendSnapshot = () => post("world.snapshot", getSnapshot() as unknown as Record<string, unknown>);
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as HostMessage | undefined;
    if (!data || data.channel !== CHANNEL || data.worldId !== WORLD_ID) return;
    if (data.type === "host.requestSnapshot") sendSnapshot();
    if (data.type === "host.focus") window.focus();
  };
  const onLeaving = () => post("world.leaving", getSnapshot() as unknown as Record<string, unknown>);
  window.addEventListener("message", onMessage);
  window.addEventListener("pagehide", onLeaving);
  post("world.ready", getSnapshot() as unknown as Record<string, unknown>);
  return () => {
    window.removeEventListener("message", onMessage);
    window.removeEventListener("pagehide", onLeaving);
  };
}
