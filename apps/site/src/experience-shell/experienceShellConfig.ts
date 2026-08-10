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
    label: "ENTRY",
    eyebrow: "BLACKCROWN / SPATIAL SYSTEM",
    title: "NEXUS READY",
    body: "One identity opens a continuous path through every BlackCrown world.",
    actions: [],
    range: [0, 0.05],
    sceneId: "crown-chamber",
    tone: "boot",
  },
  {
    id: "crown-chamber",
    hash: "crown",
    index: "01",
    label: "CROWN",
    eyebrow: "BLACKCROWN / DIGITAL CROWN NEXUS",
    title: "ONE CROWN. CONNECTED WORLDS.",
    body: "A living identity core coordinates worlds, progression and the collection around it.",
    actions: [
      { label: "EXPLORE", href: "#gate", kind: "primary" },
      { label: "ENTER CROWN//FRONT", href: "/games/crown-front/", kind: "secondary" },
    ],
    range: [0.05, 0.23],
    sceneId: "crown-chamber",
    tone: "crown",
  },
  {
    id: "world-gate",
    hash: "gate",
    index: "02",
    label: "WORLD GATE",
    eyebrow: "WORLD GATE / 01",
    title: "ENTERING BLACKCROWN WORLDS",
    actions: [],
    range: [0.23, 0.36],
    sceneId: "world-gate",
    tone: "gate",
    mobile: { hideBody: true, compactTitle: true },
  },
  {
    id: "evofish-abyss",
    hash: "evofish",
    index: "03",
    label: "EVOFISH",
    eyebrow: "WORLD / EVOFISH",
    title: "EVOLUTION BEGINS IN THE DEEP",
    body: "Descend through a living abyss where every choice changes the organism and its world.",
    actions: [{ label: "ENTER EVOFISH", href: "/game/", kind: "primary" }],
    range: [0.36, 0.52],
    sceneId: "evofish-abyss",
    tone: "ocean",
  },
  {
    id: "crown-front-reactor",
    hash: "crown-front",
    index: "04",
    label: "CROWN//FRONT",
    eyebrow: "OPERATION / ALPHA STATUS",
    title: "TACTICAL HEIST EXPERIENCE",
    body: "A black-and-orange operation forms as the abyss collapses into a tactical reactor.",
    actions: [{ label: "ENTER THE OPERATION", href: "/games/crown-front/", kind: "tactical" }],
    range: [0.52, 0.68],
    sceneId: "crown-front-reactor",
    tone: "tactical",
  },
  {
    id: "network-core",
    hash: "network",
    index: "05",
    label: "NETWORK",
    eyebrow: "BLACKCROWN NETWORK",
    title: "ONE SYSTEM. MANY WORLDS.",
    body: "Games, services and identity align around one command core.",
    actions: [{ label: "OPEN LOBBY", href: "/lobby/", kind: "primary" }],
    range: [0.68, 0.81],
    sceneId: "network-core",
    tone: "network",
  },
  {
    id: "collection-vault",
    hash: "store",
    index: "06",
    label: "COLLECTION",
    eyebrow: "BLACKCROWN COLLECTION",
    title: "YOUR ITEMS. ONE ID.",
    body: "Featured catalog objects move from the network into a collection bound to your profile.",
    actions: [
      { label: "OPEN STORE", href: "/store", kind: "primary" },
      { label: "MY COLLECTION", href: "/account", kind: "secondary" },
    ],
    range: [0.81, 0.92],
    sceneId: "collection-vault",
    tone: "vault",
  },
  {
    id: "identity-enter",
    hash: "profile",
    index: "07",
    label: "IDENTITY",
    eyebrow: "BLACKCROWN ID",
    title: "ONE PROFILE. ALL WORLDS.",
    body: "The Crown returns as identity, collection and access converge into one final portal.",
    actions: [
      { label: "ENTER", href: "/game/", kind: "primary", primaryTarget: true },
      { label: "PROFILE", href: "/account", kind: "secondary" },
      { label: "STORE", href: "/store", kind: "secondary" },
    ],
    range: [0.92, 1],
    sceneId: "identity",
    tone: "identity",
  },
] as const;

export const EXPERIENCE_STORY_HEIGHT = {
  desktopVh: 1000,
  mobileVh: 680,
  landscapeVh: 860,
  reducedVh: 430,
} as const;

export const EXPERIENCE_TRANSITION_RANGES = {
  crownToGate: [0.2, 0.27],
  gateToOcean: [0.33, 0.4],
  oceanToReactor: [0.49, 0.56],
  reactorToNetwork: [0.65, 0.72],
  networkToVault: [0.78, 0.84],
  vaultToIdentity: [0.89, 0.95],
} as const;

export const CHAPTER_BY_ID = new Map(EXPERIENCE_CHAPTERS.map((chapter) => [chapter.id, chapter]));
export const CHAPTER_BY_HASH = new Map(EXPERIENCE_CHAPTERS.map((chapter) => [chapter.hash, chapter]));

