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
  sceneId: ExperienceSceneId;
  tone: ExperienceTone;
  layout: ExperienceLayout;
  mobile?: {
    hideBody?: boolean;
    compactTitle?: boolean;
  };
};

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
    range: [0, 0.06],
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
    eyebrow: "BLACKCROWN / DIGITAL CROWN NEXUS",
    title: "DIGITAL CROWN NEXUS",
    body: "One Crown connects every BlackCrown world.",
    actions: [
      { label: "EXPLORE", href: "#gate", kind: "primary" },
      { label: "ENTER CROWN//FRONT", href: "/games/crown-front/", kind: "secondary" },
    ],
    range: [0.06, 0.30],
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
    range: [0.30, 0.43],
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
    range: [0.43, 0.57],
    sceneId: "evofish-abyss",
    tone: "ocean",
    layout: "editorial-low-left",
  },
  {
    id: "crown-front-reactor",
    hash: "crown-front",
    index: "04",
    label: "CROWN//FRONT",
    eyebrow: "OPERATION / MILITARY VAULT",
    title: "TACTICAL HEIST EXPERIENCE",
    body: "The ocean collapses into an armored BlackCrown vault built for the operation.",
    actions: [{ label: "ENTER OPERATION", href: "/games/crown-front/", kind: "tactical" }],
    range: [0.57, 0.82],
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
    title: "ONE SYSTEM. MANY WORLDS.",
    body: "The vault opens into a distributed network of games, services and identity.",
    actions: [{ label: "OPEN LOBBY", href: "/lobby/", kind: "primary" }],
    range: [0.82, 0.91],
    sceneId: "network-core",
    tone: "network",
    layout: "network-right",
  },
  {
    id: "collection-vault",
    hash: "store",
    index: "06",
    label: "COLLECTION",
    eyebrow: "BLACKCROWN COLLECTION",
    title: "YOUR ITEMS. ONE ID.",
    body: "The network resolves into a short premium collection bound to your profile.",
    actions: [
      { label: "OPEN STORE", href: "/store", kind: "primary" },
      { label: "MY COLLECTION", href: "/account", kind: "secondary" },
    ],
    range: [0.91, 0.96],
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
    body: "Pass through the Crown and enter BlackCrown.",
    actions: [
      { label: "ENTER", href: "/game/", kind: "primary", primaryTarget: true },
      { label: "PROFILE", href: "/account", kind: "secondary" },
      { label: "STORE", href: "/store", kind: "secondary" },
    ],
    range: [0.96, 1],
    sceneId: "identity",
    tone: "identity",
    layout: "final-center",
    mobile: { compactTitle: true },
  },
] as const;

export const EXPERIENCE_STORY_HEIGHT = {
  desktopVh: 940,
  mobileVh: 760,
  landscapeVh: 880,
  reducedVh: 410,
} as const;

export const EXPERIENCE_TRANSITION_RANGES = {
  crownToGate: [0.27, 0.35],
  gateToOcean: [0.35, 0.45],
  oceanToReactor: [0.54, 0.70],
  reactorToNetwork: [0.79, 0.85],
  networkToVault: [0.89, 0.93],
  vaultToIdentity: [0.94, 0.975],
} as const;

export const CHAPTER_BY_ID = new Map(EXPERIENCE_CHAPTERS.map((chapter) => [chapter.id, chapter]));
export const CHAPTER_BY_HASH = new Map(EXPERIENCE_CHAPTERS.map((chapter) => [chapter.hash, chapter]));
