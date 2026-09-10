import { WORLD_BRIDGE_CHANNEL, type WorldDefinition, type WorldId } from "./types";

export const WORLD_CATALOG = [
  {
    id: "evofish",
    title: "EvoFish Next",
    eyebrow: "OCEAN WORLD",
    description: "Основной океанский мир BLACKCROWN: развитие, коллекция существ и соревновательный прогресс.",
    version: "current",
    maturity: "live",
    lobbyRoute: "/lobby",
    runtimeUrl: "/game/?mode=next",
    runtimeKind: "external-app",
    previewAsset: "/lobby/assets/lobby/lobby-bg-station-16x9.png",
    accent: "#35d8ff",
    capabilities: ["account", "progression", "skins", "leaderboard"],
    roadmap: ["shared world identity", "cross-world rewards"],
  },
  {
    id: "quiet-valley",
    title: "Quiet Valley",
    eyebrow: "FARM GAME · ALPHA",
    description: "Самостоятельная 3D-ферма BLACKCROWN: растения, животные, заказы жителей, мягкая аренда, сюжет, расширение острова и управление персоналом.",
    version: "0.9.3",
    maturity: "alpha",
    lobbyRoute: "/games/quiet-valley/",
    runtimeUrl: "/games/quiet-valley/index.html",
    runtimeKind: "isolated-html",
    previewAsset: "/games/quiet-valley/preview.webp",
    accent: "#b9dc82",
    saveNamespace: "bc.world.quiet-valley.v1",
    bridgeChannel: WORLD_BRIDGE_CHANNEL,
    capabilities: ["3D WebGL", "touch", "local save", "story", "characters", "terrain upgrades", "estate growth", "staff automation", "restored shared renderer", "mobile premium materials"],
    roadmap: ["cloud save", "friend visits", "player market", "seasons"],
  },
  {
    id: "breakout",
    title: "BLACKCROWN // BREAKOUT",
    eyebrow: "PRISON SIM · VERTICAL SLICE",
    description: "Живой тюремный комплекс: расписание, патрули, подозрение, контрабанда и многошаговые планы побега.",
    version: "0.1.0",
    maturity: "prototype",
    lobbyRoute: "/lobby/world/breakout",
    runtimeUrl: "/games/breakout/index.html",
    runtimeKind: "isolated-html",
    previewAsset: "/games/breakout/preview.svg",
    accent: "#58e6ff",
    saveNamespace: "bc.world.breakout.v1",
    bridgeChannel: WORLD_BRIDGE_CHANNEL,
    capabilities: ["3D WebGL", "touch", "schedule simulation", "guard patrols", "suspicion", "contraband", "escape route"],
    roadmap: ["NPC relationships", "jobs", "crafting", "cell searches", "multiple escape plans", "cloud save"],
  },
] as const satisfies readonly WorldDefinition[];

const WORLD_BY_ID = new Map<WorldId, WorldDefinition>(
  WORLD_CATALOG.map((world): [WorldId, WorldDefinition] => [world.id, world]),
);

export function getWorld(id: WorldId): WorldDefinition {
  const world = WORLD_BY_ID.get(id);
  if (!world) throw new Error(`Unknown BLACKCROWN world: ${id}`);
  return world;
}
