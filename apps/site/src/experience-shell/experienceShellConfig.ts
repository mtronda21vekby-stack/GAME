export const EXPERIENCE_CHAPTER_IDS = [
  "boot",
  "crown-chamber",
  "world-gate",
  "evofish-abyss",
  "crown-front-reactor",
  "network-core",
  "collection-vault",
  "identity-enter",
] as const;

export type ExperienceChapterId = (typeof EXPERIENCE_CHAPTER_IDS)[number];

export const EXPERIENCE_SCENE_IDS = [
  "crown-chamber",
  "world-gate",
  "evofish-abyss",
  "crown-front-reactor",
  "network-core",
  "collection-vault",
  "identity",
] as const;

export type ExperienceSceneId = (typeof EXPERIENCE_SCENE_IDS)[number];
export type ExperienceTone = "boot" | "crown" | "gate" | "ocean" | "tactical" | "network" | "vault" | "identity";
export type ExperienceLayout = "entry" | "hero-left" | "system-minimal" | "editorial-low-left" | "tactical-right" | "network-right" | "vault-left" | "final-center";

export type ExperienceActionConfig = {
  label: string;
  href: string;
  kind?: "primary" | "secondary" | "tactical";
  primaryTarget?: boolean;
};

export type ExperienceChapterConfig = {
  id: ExperienceChapterId;
  hash: string;
  index: string;
  label: string;
  eyebrow: string;
  title: string;
  body?: string;
  actions: readonly ExperienceActionConfig[];
  range: readonly [number, number];
  copyRange?: readonly [number, number];
  sceneId: ExperienceSceneId;
  tone: ExperienceTone;
  layout: ExperienceLayout;
  mobile?: {
    hideBody?: boolean;
    compactTitle?: boolean;
  };
};

// The approved 0–100% directing spine. Chapter, transition, camera and timeline
// code must take their boundary values from this single source of truth.
export const EXPERIENCE_PHASE_RANGES = {
  coreAwakening: [0, 0.06],
  nanoAssembly: [0.06, 0.22],
  blackcrownHero: [0.22, 0.30],
  crownToOcean: [0.30, 0.43],
  evofishReveal: [0.43, 0.57],
  oceanToVault: [0.57, 0.70],
  crownFrontVault: [0.70, 0.82],
  vaultToNetwork: [0.82, 0.91],
  networkCollection: [0.91, 0.96],
  finalCrownPass: [0.96, 1],
} as const;

export function isExperienceRangeActive(progress: number, range: readonly [number, number]) {
  const normalized = Math.max(0, Math.min(1, progress));
  return normalized >= range[0] && (normalized < range[1] || (normalized === 1 && range[1] === 1));
}

const FINAL_CROWN_PASS_SPAN = EXPERIENCE_PHASE_RANGES.finalCrownPass[1]
  - EXPERIENCE_PHASE_RANGES.finalCrownPass[0];

// The camera owns the first 92.5% of the final beat; the remainder is pure DOM identity.
export const EXPERIENCE_FINAL_BLACKOUT_PROGRESS = EXPERIENCE_PHASE_RANGES.finalCrownPass[0]
  + FINAL_CROWN_PASS_SPAN * 0.925;

export const EXPERIENCE_CHAPTERS: readonly ExperienceChapterConfig[] = [
  {
    id: "boot",
    hash: "boot",
    index: "00",
    label: "AWAKENING",
    eyebrow: "BLACKCROWN / CORE ONLINE",
    title: "BLACKCROWN",
    body: "The core wakes before the Crown reveals itself.",
    actions: [],
    range: EXPERIENCE_PHASE_RANGES.coreAwakening,
    sceneId: "crown-chamber",
    tone: "boot",
    layout: "entry",
    mobile: { hideBody: true, compactTitle: true },
  },
  {
    id: "crown-chamber",
    hash: "crown",
    index: "01",
    label: "CROWN",
    eyebrow: "DIGITAL CROWN NEXUS",
    title: "BLACKCROWN",
    body: "ONE CROWN CONNECTS EVERY WORLD.",
    actions: [{ label: "EXPLORE", href: "#gate", kind: "primary" }],
    range: [EXPERIENCE_PHASE_RANGES.nanoAssembly[0], EXPERIENCE_PHASE_RANGES.blackcrownHero[1]],
    copyRange: EXPERIENCE_PHASE_RANGES.blackcrownHero,
    sceneId: "crown-chamber",
    tone: "crown",
    layout: "hero-left",
  },
  {
    id: "world-gate",
    hash: "gate",
    index: "02",
    label: "TRANSIT",
    eyebrow: "CROWN / OCEAN TRANSIT",
    title: "BEYOND THE CROWN",
    actions: [],
    range: EXPERIENCE_PHASE_RANGES.crownToOcean,
    copyRange: [EXPERIENCE_PHASE_RANGES.crownToOcean[0], EXPERIENCE_PHASE_RANGES.crownToOcean[0]],
    sceneId: "world-gate",
    tone: "gate",
    layout: "system-minimal",
    mobile: { hideBody: true, compactTitle: true },
  },
  {
    id: "evofish-abyss",
    hash: "evofish",
    index: "03",
    label: "EVOFISH",
    eyebrow: "WORLD / EVOFISH",
    title: "EVOLUTION BEGINS IN THE DEEP",
    body: "A silhouette in the abyss becomes a living world around you.",
    actions: [{ label: "ENTER EVOFISH", href: "/game/", kind: "primary" }],
    range: EXPERIENCE_PHASE_RANGES.evofishReveal,
    sceneId: "evofish-abyss",
    tone: "ocean",
    layout: "editorial-low-left",
  },
  {
    id: "crown-front-reactor",
    hash: "crown-front",
    index: "04",
    label: "CROWN//FRONT",
    eyebrow: "CROWN//FRONT",
    title: "TACTICAL HEIST EXPERIENCE",
    actions: [{ label: "ENTER OPERATION", href: "/games/crown-front/", kind: "tactical" }],
    range: [EXPERIENCE_PHASE_RANGES.oceanToVault[0], EXPERIENCE_PHASE_RANGES.crownFrontVault[1]],
    copyRange: EXPERIENCE_PHASE_RANGES.crownFrontVault,
    sceneId: "crown-front-reactor",
    tone: "tactical",
    layout: "tactical-right",
  },
  {
    id: "network-core",
    hash: "network",
    index: "05",
    label: "NETWORK",
    eyebrow: "BLACKCROWN NETWORK",
    title: "WORLDS IN DEPTH.",
    actions: [{ label: "OPEN LOBBY", href: "/lobby/", kind: "primary" }],
    range: EXPERIENCE_PHASE_RANGES.vaultToNetwork,
    sceneId: "network-core",
    tone: "network",
    layout: "network-right",
  },
  {
    id: "collection-vault",
    hash: "store",
    index: "06",
    label: "COLLECTION",
    eyebrow: "NETWORK / COLLECTION",
    title: "SELECTED OBJECTS.",
    actions: [
      { label: "OPEN STORE", href: "/store", kind: "primary" },
      { label: "MY COLLECTION", href: "/account", kind: "secondary" },
    ],
    range: EXPERIENCE_PHASE_RANGES.networkCollection,
    sceneId: "collection-vault",
    tone: "vault",
    layout: "vault-left",
  },
  {
    id: "identity-enter",
    hash: "profile",
    index: "07",
    label: "BLACKCROWN",
    eyebrow: "BLACKCROWN",
    title: "ONE CROWN. ALL WORLDS.",
    actions: [{ label: "ENTER", href: "/game/", kind: "primary", primaryTarget: true }],
    range: EXPERIENCE_PHASE_RANGES.finalCrownPass,
    sceneId: "identity",
    tone: "identity",
    layout: "final-center",
    mobile: { compactTitle: true },
  },
] as const;

export const EXPERIENCE_STORY_HEIGHT = {
  // Native scroll remains authoritative. The extended physical distance makes
  // a normal read land around the directed 40–60 second experience instead of
  // collapsing the ten beats into a 15 second skim.
  desktopVh: 6800,
  mobileVh: 6000,
  landscapeVh: 6200,
  // Reduced motion remains deliberately compact and avoids the cinematic
  // dwell distance while preserving every semantic chapter and CTA.
  reducedVh: 520,
} as const;

export const EXPERIENCE_TRANSITION_RANGES = {
  // WorldGate is the spatial bridge inside the single 30–43% Crown→Ocean beat.
  crownToGate: [0.30, 0.365],
  gateToOcean: [0.365, 0.43],
  oceanToReactor: EXPERIENCE_PHASE_RANGES.oceanToVault,
  reactorToNetwork: EXPERIENCE_PHASE_RANGES.vaultToNetwork,
  networkToVault: EXPERIENCE_PHASE_RANGES.networkCollection,
  vaultToIdentity: EXPERIENCE_PHASE_RANGES.finalCrownPass,
} as const;

export const CHAPTER_BY_ID = new Map(EXPERIENCE_CHAPTERS.map((chapter) => [chapter.id, chapter]));
export const CHAPTER_BY_HASH = new Map(EXPERIENCE_CHAPTERS.map((chapter) => [chapter.hash, chapter]));
