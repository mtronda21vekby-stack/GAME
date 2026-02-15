import type { WSClient } from "./types";
import { createMockWS } from "./mockTransport";

/**
 * WS abstraction. For now:
 *  - url "mock://lobby" -> BroadcastChannel transport
 */
export function createWS(url: string): WSClient {
  if (url.startsWith("mock://")) {
    const channel = url.replace("mock://", "bc:");
    return createMockWS(channel);
  }
  // Production-safe fallback
  return createMockWS("bc:fallback");
}

export type { WSClient } from "./types";
export type { WSMessage } from "./types";
