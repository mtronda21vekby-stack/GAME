import React from "react";

type MobileParallaxKind =
  | "hero-core"
  | "hero-atmosphere"
  | "hero-copy"
  | "world-image"
  | "world-visual"
  | "world-copy"
  | "service"
  | "other";

type MobileParallaxTarget = {
  element: HTMLElement;
  depth: number;
  scale: number;
  factor: number;
  kind: MobileParallaxKind;
  fastEssential: boolean;
};

type CinematicScenes = {
  hero: HTMLElement | null;
  oceanTransition: HTMLElement | null;
  oceanWorld: HTMLElement | null;
  reactorTransition: HTMLElement | null;
  reactorWorld: HTMLElement | null;
};

const SCENE_VARIABLES = [
  "--bc-hero-core-scale-offset",
  "--bc-hero-core-shift",
  "--bc-hero-core-opacity",
  "--bc-hero-copy-shift",
  "--bc-hero-copy-opacity",
  "--bc-hero-grid-opacity",
  "--bc-hero-light-opacity",
  "--bc-hero-floor-opacity",
  "--bc-ocean-depth-opacity",
  "--bc-ocean-depth-shift",
  "--bc-ocean-depth-scale",
  "--bc-ocean-energy-opacity",
  "--bc-ocean-energy-x",
  "--bc-ocean-energy-y",
  "--bc-ocean-particles-opacity",
  "--bc-ocean-particles-shift",
  "--bc-ocean-label-opacity",
  "--bc-ocean-label-shift",
  "--bc-ocean-label-scale",
  "--bc-ocean-caustic-opacity",
  "--bc-ocean-caustic-shift",
  "--bc-ocean-world-glow-opacity",
  "--bc-reactor-depth-opacity",
  "--bc-reactor-depth-shift",
  "--bc-reactor-depth-scale",
  "--bc-reactor-energy-opacity",
  "--bc-reactor-energy-x",
  "--bc-reactor-energy-y",
  "--bc-reactor-particles-opacity",
  "--bc-reactor-particles-shift",
  "--bc-reactor-label-opacity",
  "--bc-reactor-label-shift",
  "--bc-reactor-label-scale",
  "--bc-reactor-world-glow-opacity",
  "--bc-reactor-world-shift",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function bell(progress: number) {
  return clamp(1 - Math.abs(progress - 0.5) * 2, 0, 1);
}

function readNumber(element: HTMLElement, name: string, fallback = 0) {
  const value = Number(element.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
}

function travelProgress(rect: DOMRect, viewportHeight: number) {
  const startLine = viewportHeight * 0.92;
  const travel = Math.max(viewportHeight * 0.72, rect.height * 0.8);
  return clamp((startLine - rect.top) / travel, 0, 1);
}

function scenePresence(rect: DOMRect, viewportHeight: number) {
  const center = rect.top + rect.height * 0.5;
  const radius = viewportHeight * 0.72 + rect.height * 0.32;
  return clamp(1 - Math.abs(center - viewportHeight * 0.5) / Math.max(1, radius), 0, 1);
}

function heroExitProgress(rect: DOMRect, viewportHeight: number) {
  const distance = -rect.top - viewportHeight * 0.03;
  const travel = Math.max(viewportHeight * 0.78, rect.height * 0.68);
  return clamp(distance / travel, 0, 1);
}

function setPx(element: HTMLElement, name: string, value: number) {
  element.style.setProperty(name, `${value.toFixed(2)}px`);
}

function setNumber(element: HTMLElement, name: string, value: number) {
  element.style.setProperty(name, value.toFixed(5));
}

function clearSceneVariables(element: HTMLElement | null) {
  if (!element) return;
  for (const variable of SCENE_VARIABLES) element.style.removeProperty(variable);
}

function classifyTarget(element: HTMLElement): MobileParallaxKind {
  if (element.classList.contains("bcV3Hero__core")) return "hero-core";
  if (
    element.classList.contains("bcV3Hero__light") ||
    element.classList.contains("bcV3Hero__grid") ||
    element.classList.contains("bcNexusHero__focus")
  ) {
    return "hero-atmosphere";
  }
  if (
    element.classList.contains("bcV3Hero__copy") ||
    element.classList.contains("bcV3Hero__status")
  ) {
    return "hero-copy";
  }
  if (element.matches(".bcWorldStageV2__visual img")) return "world-image";
  if (element.classList.contains("bcWorldStageV2__visual")) return "world-visual";
  if (element.classList.contains("bcWorldStageV2__copy")) return "world-copy";
  if (element.closest(".bcPlatformV3, .bcStoreV3, .bcCoachV3")) return "service";
  return "other";
}

function factorForTarget(element: HTMLElement, kind: MobileParallaxKind) {
  switch (kind) {
    case "hero-core":
      return 1.18;
    case "hero-atmosphere":
      if (element.classList.contains("bcV3Hero__light")) return 0.94;
      if (element.classList.contains("bcV3Hero__grid")) return 0.58;
      return 0.68;
    case "hero-copy":
      return element.classList.contains("bcV3Hero__status") ? 0.28 : 0.46;
    case "world-image":
      return 1.14;
    case "world-visual":
      return 0.76;
    case "world-copy":
      return 0.42;
    case "service":
      return 0.44;
    default:
      return 0.38;
  }
}

function isFastEssential(kind: MobileParallaxKind) {
  return (
    kind === "hero-core" ||
    kind === "hero-copy" ||
    kind === "world-image" ||
    kind === "world-visual" ||
    kind === "world-copy"
  );
}

/**
 * Adaptive mobile cinematic parallax.
 *
 * The desktop director can afford many continuously interpolated layers. Safari
 * on iPhone cannot reliably afford the same compositor budget while its browser
 * chrome is also resizing during a fast flick. Mobile therefore keeps the same
 * depth language with a different runtime strategy:
 *
 * - only targets near the viewport are promoted and measured
 * - each active target receives only translateY + scale writes
 * - cinematic world-gate variables are still driven by scroll progress
 * - fast flicks keep the important parallax planes moving while temporarily
 *   pausing purely decorative glow/particle work in CSS
 * - there is no continuous easing loop after scrolling stops
 */
export function MobileParallaxDirector() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) return;

    root.classList.add("bcPremiumParallax", "bcMobileParallaxAdaptive");

    let home: HTMLElement | null = null;
    let targets: MobileParallaxTarget[] = [];
    let scenes: CinematicScenes = {
      hero: null,
      oceanTransition: null,
      oceanWorld: null,
      reactorTransition: null,
      reactorWorld: null,
    };
    let activeTargets = new Set<HTMLElement>();
    let intersectionObserver: IntersectionObserver | null = null;
    let routeObserver: MutationObserver | null = null;
    let frame = 0;
    let viewportHeight = Math.max(1, window.innerHeight);
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let fastScroll = false;
    let idleTimer = 0;
    let viewportTimer = 0;

    const clearTarget = (target: MobileParallaxTarget) => {
      target.element.classList.remove("bcMobileParallaxTarget");
      target.element.style.removeProperty("--bc-parallax-x");
      target.element.style.removeProperty("--bc-parallax-y");
      target.element.style.removeProperty("--bc-parallax-rx");
      target.element.style.removeProperty("--bc-parallax-ry");
      target.element.style.removeProperty("--bc-parallax-scale");
    };

    const setFastScroll = (next: boolean) => {
      if (fastScroll === next) return;
      fastScroll = next;
      root.classList.toggle("bcMobileParallaxFast", next);
      requestTick();
    };

    const buildIntersectionObserver = () => {
      intersectionObserver?.disconnect();
      activeTargets.clear();

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          let changed = false;
          for (const entry of entries) {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              if (!activeTargets.has(element)) {
                activeTargets.add(element);
                element.classList.add("bcMobileParallaxTarget");
                changed = true;
              }
            } else if (activeTargets.delete(element)) {
              element.classList.remove("bcMobileParallaxTarget");
              changed = true;
            }
          }
          if (changed) requestTick();
        },
        { rootMargin: "48% 0px 48% 0px", threshold: 0 }
      );

      for (const target of targets) intersectionObserver.observe(target.element);
    };

    const refreshTargets = () => {
      intersectionObserver?.disconnect();
      targets.forEach(clearTarget);
      activeTargets.clear();
      clearSceneVariables(home);

      home = document.querySelector<HTMLElement>(".bcHomeV3");
      scenes = {
        hero: home?.querySelector<HTMLElement>(".bcV3Hero") ?? null,
        oceanTransition: home?.querySelector<HTMLElement>('[data-bc-transition="ocean"]') ?? null,
        oceanWorld: home?.querySelector<HTMLElement>('.bcWorldStageV2[data-tone="ocean"]') ?? null,
        reactorTransition: home?.querySelector<HTMLElement>('[data-bc-transition="reactor"]') ?? null,
        reactorWorld: home?.querySelector<HTMLElement>('.bcWorldStageV2[data-tone="reactor"]') ?? null,
      };

      if (!home) {
        targets = [];
        return;
      }

      targets = Array.from(home.querySelectorAll<HTMLElement>("[data-bc-parallax]")).map((element) => {
        const kind = classifyTarget(element);
        element.style.setProperty("--bc-parallax-x", "0px");
        element.style.setProperty("--bc-parallax-rx", "0deg");
        element.style.setProperty("--bc-parallax-ry", "0deg");

        return {
          element,
          kind,
          depth: readNumber(element, "bcParallaxDepth", 8),
          scale: readNumber(element, "bcParallaxScale", 0),
          factor: factorForTarget(element, kind),
          fastEssential: isFastEssential(kind),
        };
      });

      buildIntersectionObserver();
      requestTick();
    };

    const writeTarget = (target: MobileParallaxTarget) => {
      if (!activeTargets.has(target.element)) return;
      if (fastScroll && !target.fastEssential) return;

      const rect = target.element.getBoundingClientRect();
      const center = rect.top + rect.height * 0.5;
      const denominator = Math.max(viewportHeight * 0.68, rect.height * 0.78);
      const delta = clamp((viewportHeight * 0.5 - center) / denominator, -1.1, 1.1);
      const presence = clamp(1 - Math.abs(delta) * 0.72, 0, 1);
      const maxAmplitude = target.kind === "world-image" ? 48 : target.kind === "hero-core" ? 42 : 38;
      const amplitude = clamp(Math.abs(target.depth) * target.factor, 3, maxAmplitude);
      const y = delta * amplitude;
      const scaleBoost = target.kind === "hero-core" ? 1.12 : target.kind === "world-image" ? 1.05 : 1;
      const scale = presence * target.scale * scaleBoost;

      target.element.style.setProperty("--bc-parallax-y", `${y.toFixed(2)}px`);
      target.element.style.setProperty("--bc-parallax-scale", scale.toFixed(5));
    };

    const writeCinematicScenes = () => {
      if (!home) return;

      const heroExit = scenes.hero
        ? heroExitProgress(scenes.hero.getBoundingClientRect(), viewportHeight)
        : 0;
      setNumber(home, "--bc-hero-core-scale-offset", -0.12 * heroExit);
      setPx(home, "--bc-hero-core-shift", 42 * heroExit);
      setNumber(home, "--bc-hero-core-opacity", 1 - 0.16 * heroExit);
      setPx(home, "--bc-hero-copy-shift", -18 * heroExit);
      setNumber(home, "--bc-hero-copy-opacity", 1 - 0.24 * heroExit);
      setNumber(home, "--bc-hero-grid-opacity", 1 - 0.72 * heroExit);
      setNumber(home, "--bc-hero-light-opacity", 1 - 0.5 * heroExit);
      setNumber(home, "--bc-hero-floor-opacity", 1 - 0.54 * heroExit);

      if (scenes.oceanTransition) {
        const progress = travelProgress(scenes.oceanTransition.getBoundingClientRect(), viewportHeight);
        const pulse = bell(progress);
        setNumber(home, "--bc-ocean-depth-opacity", 0.34 + pulse * 0.66);
        setPx(home, "--bc-ocean-depth-shift", 42 - progress * 84);
        setNumber(home, "--bc-ocean-depth-scale", 0.95 + pulse * 0.065);
        setNumber(home, "--bc-ocean-energy-opacity", 0.14 + pulse * 0.56);
        setPx(home, "--bc-ocean-energy-x", -18 + progress * 36);
        setPx(home, "--bc-ocean-energy-y", 30 - progress * 60);
        setNumber(home, "--bc-ocean-particles-opacity", 0.12 + pulse * 0.38);
        setPx(home, "--bc-ocean-particles-shift", 34 - progress * 68);
        setNumber(home, "--bc-ocean-label-opacity", clamp(pulse * 1.75, 0, 1));
        setPx(home, "--bc-ocean-label-shift", 24 - progress * 48);
        setNumber(home, "--bc-ocean-label-scale", 0.96 + pulse * 0.045);
      }

      if (scenes.oceanWorld) {
        const rect = scenes.oceanWorld.getBoundingClientRect();
        const presence = scenePresence(rect, viewportHeight);
        const travel = travelProgress(rect, viewportHeight);
        setNumber(home, "--bc-ocean-caustic-opacity", 0.1 + presence * 0.26);
        setPx(home, "--bc-ocean-caustic-shift", 18 - travel * 36);
        setNumber(home, "--bc-ocean-world-glow-opacity", 0.18 + presence * 0.4);
      }

      if (scenes.reactorTransition) {
        const progress = travelProgress(scenes.reactorTransition.getBoundingClientRect(), viewportHeight);
        const pulse = bell(progress);
        setNumber(home, "--bc-reactor-depth-opacity", 0.28 + pulse * 0.72);
        setPx(home, "--bc-reactor-depth-shift", 38 - progress * 76);
        setNumber(home, "--bc-reactor-depth-scale", 0.95 + pulse * 0.07);
        setNumber(home, "--bc-reactor-energy-opacity", 0.1 + pulse * 0.58);
        setPx(home, "--bc-reactor-energy-x", -16 + progress * 32);
        setPx(home, "--bc-reactor-energy-y", 30 - progress * 60);
        setNumber(home, "--bc-reactor-particles-opacity", 0.08 + pulse * 0.3);
        setPx(home, "--bc-reactor-particles-shift", 32 - progress * 64);
        setNumber(home, "--bc-reactor-label-opacity", clamp(pulse * 1.8, 0, 1));
        setPx(home, "--bc-reactor-label-shift", 22 - progress * 44);
        setNumber(home, "--bc-reactor-label-scale", 0.965 + pulse * 0.04);
      }

      if (scenes.reactorWorld) {
        const rect = scenes.reactorWorld.getBoundingClientRect();
        const presence = scenePresence(rect, viewportHeight);
        const travel = travelProgress(rect, viewportHeight);
        setNumber(home, "--bc-reactor-world-glow-opacity", 0.18 + presence * 0.44);
        setPx(home, "--bc-reactor-world-shift", 16 - travel * 32);
      }
    };

    const tick = () => {
      frame = 0;
      if (!home) return;

      for (const target of targets) writeTarget(target);
      writeCinematicScenes();
    };

    function requestTick() {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const elapsed = Math.max(8, now - lastScrollAt);
      const velocity = (Math.abs(y - lastScrollY) / elapsed) * 1000;

      lastScrollY = y;
      lastScrollAt = now;

      if (velocity > 1650) setFastScroll(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setFastScroll(false), 150);
      requestTick();
    };

    const onWindowResize = () => {
      viewportHeight = Math.max(1, window.innerHeight);
      requestTick();
    };

    const onVisualViewportResize = () => {
      // Safari changes visualViewport continuously while collapsing browser
      // chrome. Debounce it so scroll parallax does not compete with layout.
      window.clearTimeout(viewportTimer);
      viewportTimer = window.setTimeout(() => {
        viewportHeight = Math.max(1, window.innerHeight);
        requestTick();
      }, 120);
    };

    const onMotionPreference = () => {
      if (!reducedMotion.matches) return;
      root.classList.remove("bcPremiumParallax", "bcMobileParallaxAdaptive", "bcMobileParallaxFast");
      targets.forEach(clearTarget);
      clearSceneVariables(home);
    };

    refreshTargets();

    const appContent = document.querySelector<HTMLElement>(".bcAppContent");
    routeObserver = new MutationObserver(() => queueMicrotask(refreshTargets));
    routeObserver.observe(appContent ?? document.body, { childList: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onWindowResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onVisualViewportResize, { passive: true });
    reducedMotion.addEventListener?.("change", onMotionPreference);

    return () => {
      root.classList.remove("bcPremiumParallax", "bcMobileParallaxAdaptive", "bcMobileParallaxFast");
      intersectionObserver?.disconnect();
      routeObserver?.disconnect();
      targets.forEach(clearTarget);
      clearSceneVariables(home);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.clearTimeout(viewportTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWindowResize);
      window.visualViewport?.removeEventListener("resize", onVisualViewportResize);
      reducedMotion.removeEventListener?.("change", onMotionPreference);
    };
  }, []);

  return null;
}

export default MobileParallaxDirector;
