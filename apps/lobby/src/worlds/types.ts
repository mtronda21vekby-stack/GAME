export type WorldId = "evofish" | "quiet-valley";
export type WorldRuntimeKind = "external-app" | "isolated-html";
export type WorldMaturity = "live" | "alpha" | "prototype";

export type WorldDefinition = {
  id: WorldId;
  title: string;
  eyebrow: string;
  description: string;
  version: string;
  maturity: WorldMaturity;
  lobbyRoute: string;
  runtimeUrl: string;
  runtimeKind: WorldRuntimeKind;
  previewAsset: string;
  accent: string;
  saveNamespace?: string;
  bridgeChannel?: string;
  capabilities: readonly string[];
  roadmap: readonly string[];
};

export const WORLD_BRIDGE_CHANNEL = "blackcrown.world.v1" as const;

export type WorldBridgeMessage = {
  channel: typeof WORLD_BRIDGE_CHANNEL;
  worldId: WorldId;
  version: string;
  type: "world.ready" | "world.snapshot" | "world.leaving";
  payload: Record<string, unknown> | null;
  at: number;
};

export type WorldHostMessage = {
  channel: typeof WORLD_BRIDGE_CHANNEL;
  worldId: WorldId;
  type: "host.requestSnapshot" | "host.focus";
};
