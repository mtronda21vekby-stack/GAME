import { WORLD_BRIDGE_CHANNEL, type WorldBridgeMessage, type WorldHostMessage, type WorldId } from "./types";

export function isWorldBridgeMessage(value: unknown): value is WorldBridgeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<WorldBridgeMessage>;
  return (
    message.channel === WORLD_BRIDGE_CHANNEL &&
    typeof message.worldId === "string" &&
    typeof message.version === "string" &&
    typeof message.type === "string" &&
    typeof message.at === "number"
  );
}

export function makeWorldHostMessage(worldId: WorldId, type: WorldHostMessage["type"]): WorldHostMessage {
  return { channel: WORLD_BRIDGE_CHANNEL, worldId, type };
}
