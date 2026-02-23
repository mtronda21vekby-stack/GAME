import "./tokens.css";
import "./themes/appleGlass.css";
import "./motion/motion.css";

// keep existing UI exports (site/game/lobby могут на них рассчитывать)
export { Button } from "./components/Button";
export { Modal } from "./components/Modal";
export { Drawer } from "./components/Drawer";
export { Tabs } from "./components/Tabs";
export { Toggle } from "./components/Toggle";
export { ToastViewport } from "./components/Toast";

export { useToasts } from "./hooks/useToasts";
export { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
export { useSafeAreaInsets } from "./hooks/useSafeAreaInsets";

// motion primitives (если у тебя реально есть ./motion/index.ts — оставляем)
export * from "./motion";

// stable constants (ok)
export const PwaManifests = {
  site: "/manifest.webmanifest",
  lobby: "/manifest.webmanifest",
} as const;

// IMPORTANT:
// НЕ экспортируем Icons/HeroArt из ui — это лежит в @blackcrown/assets.
// Так мы не тащим несуществующие файлы и не ломаем билд.
