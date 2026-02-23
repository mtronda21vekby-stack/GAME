// packages/ui/src/index.ts
// Production-safe barrel: экспортируем только то, что реально существует.
// НИКАКИХ импортов CSS здесь — иначе Vite/Rollup упадёт, если файла нет.

export { Button } from "./components/Button";
export { Modal } from "./components/Modal";
export { Drawer } from "./components/Drawer";
export { Tabs } from "./components/Tabs";
export { Toggle } from "./components/Toggle";
export { ToastViewport } from "./components/Toast";

export { useToasts } from "./hooks/useToasts";
export { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
export { useSafeAreaInsets } from "./hooks/useSafeAreaInsets";

// ✅ Reveal (нужен apps/site/src/routes/pages/Admin.tsx)
export { Reveal } from "./Reveal";
export type { RevealProps } from "./Reveal";

// Если motion папка реально есть — ок. Если нет, ВРЕМЕННО закомментируй 2 строки ниже.
// export * from "./motion";
// export * from "./theme";

export const PwaManifests = {
  site: "/manifest.webmanifest",
  lobby: "/manifest.webmanifest",
} as const;
