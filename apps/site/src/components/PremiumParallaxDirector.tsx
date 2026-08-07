import React from "react";
import "../styles/premium-parallax.css";

type ParallaxNode = {
  element: HTMLElement;
  depth: number;
  pointer: number;
  rotate: number;
  scale: number;
  currentX: number;
  currentY: number;
  currentRx: number;
  currentRy: number;
  currentScale: number;
  targetX: number;
  targetY: number;
  targetRx: number;
  targetRy: number;
  targetScale: number;
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

function readNumber(element: HTMLElement, name: string, fallback = 0) {
  const value = Number(element.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
}

function near(a: number, b: number, epsilon = 0.015) {
  return Math.abs(a - b) <= epsilon;
}

function bell(progress: number) {
  return clamp(1 - Math.abs(progress - 0.5) * 2, 0, 1);
}

function travelProgress(rect: DOMRect, viewportHeight: number) {
  const startLine = viewportHeight * 0.92;
  const travel = Math.max(viewportHeight * 0.7, rect.height * 0.78);
  return clamp((startLine - rect.top) / travel, 0, 1);
}

function scenePresence(rect: DOMRect, viewportHeight: number) {
  const center = rect.top + rect.height * 0.5;
  const radius = viewportHeight * 0.7 + rect.height * 0.34;
  return clamp(1 - Math.abs(center - viewportHeight * 0.5) / Math.max(1, radius), 0, 1);
}

function heroExitProgress(rect: DOMRect, viewportHeight: number) {
  const distance = -rect.top - viewportHeight * 0.06;
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

/**
 * BlackCrown premium depth + cinematic transition director.
 *
 * Native scrolling remains authoritative. The controller only reads geometry
 * after scroll/resize and writes compositor-friendly CSS variables. It never
 * transforms the top navigation/header. Fine-pointer devices get a subtle
 * pointer camera; compact/mobile viewports remain scroll-only.
 */
export function PremiumParallaxDirector() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const compactViewport = window.matchMedia("(max-width: 820px)");

    if (reducedMotion.matches) return;

    root.classList.add("bcPremiumParallax");

    let nodes: ParallaxNode[] = [];
    let homeElement: HTMLElement | null = null;
    let scenes: CinematicScenes = {
      hero: null,
      oceanTransition: null,
      oceanWorld: null,
      reactorTransition: null,
      reactorWorld: null,
    };
    let frame = 0;
    let geometryDirty = true;
    let pointerDirty = true;
    let refreshQueued = false;
    let viewportWidth = Math.max(1, window.innerWidth);
    let viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);
    let pointerTargetX = 0;
    let pointerTargetY = 0;

    const clearNode = (node: ParallaxNode) => {
      node.element.style.removeProperty("--bc-parallax-x");
      node.element.style.removeProperty("--bc-parallax-y");
      node.element.style.removeProperty("--bc-parallax-rx");
      node.element.style.removeProperty("--bc-parallax-ry");
      node.element.style.removeProperty("--bc-parallax-scale");
    };

    const refreshNodes = () => {
      refreshQueued = false;
      const previousHome = homeElement;
      const previous = new Map(nodes.map((node) => [node.element, node]));
      const nextHome = document.querySelector<HTMLElement>(".bcHomeV3");
      const nextElements = nextHome
        ? Array.from(nextHome.querySelectorAll<HTMLElement>("[data-bc-parallax]"))
        : [];

      if (previousHome && previousHome !== nextHome) clearSceneVariables(previousHome);
      homeElement = nextHome;

      scenes = {
        hero: nextHome?.querySelector<HTMLElement>(".bcV3Hero") ?? null,
        oceanTransition:
          nextHome?.querySelector<HTMLElement>('[data-bc-transition="ocean"]') ?? null,
        oceanWorld:
          nextHome?.querySelector<HTMLElement>('.bcWorldStageV2[data-tone="ocean"]') ?? null,
        reactorTransition:
          nextHome?.querySelector<HTMLElement>('[data-bc-transition="reactor"]') ?? null,
        reactorWorld:
          nextHome?.querySelector<HTMLElement>('.bcWorldStageV2[data-tone="reactor"]') ?? null,
      };

      const nextNodes = nextElements.map<ParallaxNode>((element) => {
        const old = previous.get(element);
        if (old) {
          old.depth = readNumber(element, "bcParallaxDepth");
          old.pointer = readNumber(element, "bcParallaxPointer");
          old.rotate = readNumber(element, "bcParallaxRotate");
          old.scale = readNumber(element, "bcParallaxScale");
          previous.delete(element);
          return old;
        }

        return {
          element,
          depth: readNumber(element, "bcParallaxDepth"),
          pointer: readNumber(element, "bcParallaxPointer"),
          rotate: readNumber(element, "bcParallaxRotate"),
          scale: readNumber(element, "bcParallaxScale"),
          currentX: 0,
          currentY: 0,
          currentRx: 0,
          currentRy: 0,
          currentScale: 0,
          targetX: 0,
          targetY: 0,
          targetRx: 0,
          targetRy: 0,
          targetScale: 0,
        };
      });

      previous.forEach(clearNode);
      nodes = nextNodes;
      geometryDirty = true;
      pointerDirty = true;
      requestTick();
    };

    const queueRefresh = () => {
      if (refreshQueued) return;
      refreshQueued = true;
      queueMicrotask(refreshNodes);
    };

    const writeCinematicScenes = () => {
      const home = homeElement;
      if (!home) return;

      const mobile = compactViewport.matches;

      const heroExit = scenes.hero
        ? heroExitProgress(scenes.hero.getBoundingClientRect(), viewportHeight)
        : 0;
      const heroFactor = mobile ? 0.56 : 1;
      setNumber(home, "--bc-hero-core-scale-offset", -0.16 * heroExit * heroFactor);
      setPx(home, "--bc-hero-core-shift", 27 * heroExit * heroFactor);
      setNumber(home, "--bc-hero-core-opacity", 1 - 0.34 * heroExit * heroFactor);
      setPx(home, "--bc-hero-copy-shift", -10 * heroExit * heroFactor);
      setNumber(home, "--bc-hero-copy-opacity", 1 - 0.14 * heroExit * heroFactor);
      setNumber(home, "--bc-hero-grid-opacity", 1 - 0.72 * heroExit);
      setNumber(home, "--bc-hero-light-opacity", 1 - 0.46 * heroExit);
      setNumber(home, "--bc-hero-floor-opacity", 1 - 0.58 * heroExit);

      const oceanProgress = scenes.oceanTransition
        ? travelProgress(scenes.oceanTransition.getBoundingClientRect(), viewportHeight)
        : 0;
      const oceanBell = bell(oceanProgress);
      const oceanMotion = mobile ? 0.52 : 1;
      setNumber(home, "--bc-ocean-depth-opacity", 0.3 + oceanBell * 0.7);
      setPx(home, "--bc-ocean-depth-shift", (58 - oceanProgress * 76) * oceanMotion);
      setNumber(home, "--bc-ocean-depth-scale", 0.94 + oceanBell * 0.07);
      setNumber(home, "--bc-ocean-energy-opacity", 0.08 + oceanBell * 0.68);
      setPx(home, "--bc-ocean-energy-x", (-24 + oceanProgress * 48) * oceanMotion);
      setPx(home, "--bc-ocean-energy-y", (34 - oceanProgress * 68) * oceanMotion);
      setNumber(home, "--bc-ocean-particles-opacity", 0.14 + oceanBell * 0.48);
      setPx(home, "--bc-ocean-particles-shift", (46 - oceanProgress * 92) * oceanMotion);
      setNumber(home, "--bc-ocean-label-opacity", clamp(oceanBell * 1.7, 0, 1));
      setPx(home, "--bc-ocean-label-shift", (22 - oceanProgress * 44) * oceanMotion);
      setNumber(home, "--bc-ocean-label-scale", 0.96 + oceanBell * 0.045);

      const oceanWorldRect = scenes.oceanWorld?.getBoundingClientRect() ?? null;
      const oceanPresence = oceanWorldRect ? scenePresence(oceanWorldRect, viewportHeight) : 0;
      const oceanWorldTravel = oceanWorldRect ? travelProgress(oceanWorldRect, viewportHeight) : 0;
      setNumber(home, "--bc-ocean-caustic-opacity", 0.08 + oceanPresence * 0.3);
      setPx(home, "--bc-ocean-caustic-shift", (24 - oceanWorldTravel * 48) * oceanMotion);
      setNumber(home, "--bc-ocean-world-glow-opacity", 0.16 + oceanPresence * 0.46);

      const reactorProgress = scenes.reactorTransition
        ? travelProgress(scenes.reactorTransition.getBoundingClientRect(), viewportHeight)
        : 0;
      const reactorBell = bell(reactorProgress);
      const reactorMotion = mobile ? 0.5 : 1;
      setNumber(home, "--bc-reactor-depth-opacity", 0.22 + reactorBell * 0.78);
      setPx(home, "--bc-reactor-depth-shift", (42 - reactorProgress * 76) * reactorMotion);
      setNumber(home, "--bc-reactor-depth-scale", 0.95 + reactorBell * 0.075);
      setNumber(home, "--bc-reactor-energy-opacity", 0.06 + reactorBell * 0.72);
      setPx(home, "--bc-reactor-energy-x", (-18 + reactorProgress * 36) * reactorMotion);
      setPx(home, "--bc-reactor-energy-y", (38 - reactorProgress * 76) * reactorMotion);
      setNumber(home, "--bc-reactor-particles-opacity", 0.08 + reactorBell * 0.42);
      setPx(home, "--bc-reactor-particles-shift", (48 - reactorProgress * 90) * reactorMotion);
      setNumber(home, "--bc-reactor-label-opacity", clamp(reactorBell * 1.75, 0, 1));
      setPx(home, "--bc-reactor-label-shift", (20 - reactorProgress * 40) * reactorMotion);
      setNumber(home, "--bc-reactor-label-scale", 0.965 + reactorBell * 0.04);

      const reactorWorldRect = scenes.reactorWorld?.getBoundingClientRect() ?? null;
      const reactorPresence = reactorWorldRect ? scenePresence(reactorWorldRect, viewportHeight) : 0;
      const reactorWorldTravel = reactorWorldRect
        ? travelProgress(reactorWorldRect, viewportHeight)
        : 0;
      setNumber(home, "--bc-reactor-world-glow-opacity", 0.14 + reactorPresence * 0.58);
      setPx(home, "--bc-reactor-world-shift", (18 - reactorWorldTravel * 36) * reactorMotion);
    };

    const measureTargets = () => {
      const mobileFactor = compactViewport.matches ? 0.44 : 1;
      const pointerEnabled = finePointer.matches && !compactViewport.matches;
      const effectivePointerX = pointerEnabled ? pointerTargetX : 0;
      const effectivePointerY = pointerEnabled ? pointerTargetY : 0;

      const measurements = nodes.map((node) => {
        const rect = node.element.getBoundingClientRect();
        const centerY = rect.top + rect.height * 0.5;
        const viewportDelta = clamp(
          (viewportHeight * 0.5 - centerY) / Math.max(viewportHeight, rect.height),
          -1.15,
          1.15
        );

        return {
          node,
          x: effectivePointerX * node.pointer * mobileFactor,
          y:
            viewportDelta * node.depth * mobileFactor +
            effectivePointerY * node.pointer * 0.28 * mobileFactor,
          rx: -effectivePointerY * node.rotate * mobileFactor,
          ry: effectivePointerX * node.rotate * mobileFactor,
          scale:
            Math.max(0, 1 - Math.min(1, Math.abs(viewportDelta))) *
            node.scale *
            mobileFactor,
        };
      });

      for (const measurement of measurements) {
        measurement.node.targetX = measurement.x;
        measurement.node.targetY = measurement.y;
        measurement.node.targetRx = measurement.rx;
        measurement.node.targetRy = measurement.ry;
        measurement.node.targetScale = measurement.scale;
      }

      writeCinematicScenes();
      geometryDirty = false;
      pointerDirty = false;
    };

    const writeNode = (node: ParallaxNode) => {
      const smoothing = compactViewport.matches ? 0.2 : 0.14;
      node.currentX += (node.targetX - node.currentX) * smoothing;
      node.currentY += (node.targetY - node.currentY) * smoothing;
      node.currentRx += (node.targetRx - node.currentRx) * smoothing;
      node.currentRy += (node.targetRy - node.currentRy) * smoothing;
      node.currentScale += (node.targetScale - node.currentScale) * smoothing;

      node.element.style.setProperty("--bc-parallax-x", `${node.currentX.toFixed(2)}px`);
      node.element.style.setProperty("--bc-parallax-y", `${node.currentY.toFixed(2)}px`);
      node.element.style.setProperty("--bc-parallax-rx", `${node.currentRx.toFixed(3)}deg`);
      node.element.style.setProperty("--bc-parallax-ry", `${node.currentRy.toFixed(3)}deg`);
      node.element.style.setProperty("--bc-parallax-scale", node.currentScale.toFixed(5));

      return !(
        near(node.currentX, node.targetX) &&
        near(node.currentY, node.targetY) &&
        near(node.currentRx, node.targetRx, 0.002) &&
        near(node.currentRy, node.targetRy, 0.002) &&
        near(node.currentScale, node.targetScale, 0.0002)
      );
    };

    const tick = () => {
      frame = 0;

      if (geometryDirty || pointerDirty) measureTargets();

      let moving = false;
      for (const node of nodes) {
        if (writeNode(node)) moving = true;
      }

      if (moving) requestTick();
    };

    function requestTick() {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    }

    const onScroll = () => {
      geometryDirty = true;
      requestTick();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || compactViewport.matches) return;
      pointerTargetX = clamp((event.clientX / viewportWidth - 0.5) * 2, -1, 1);
      pointerTargetY = clamp((event.clientY / viewportHeight - 0.5) * 2, -1, 1);
      pointerDirty = true;
      requestTick();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointerTargetX = 0;
      pointerTargetY = 0;
      pointerDirty = true;
      requestTick();
    };

    const onResize = () => {
      viewportWidth = Math.max(1, window.innerWidth);
      viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);
      pointerTargetX = 0;
      pointerTargetY = 0;
      geometryDirty = true;
      pointerDirty = true;
      requestTick();
    };

    const onMotionPreference = () => {
      if (reducedMotion.matches) {
        root.classList.remove("bcPremiumParallax");
        nodes.forEach(clearNode);
        clearSceneVariables(homeElement);
        return;
      }
      root.classList.add("bcPremiumParallax");
      geometryDirty = true;
      requestTick();
    };

    const mutationObserver = new MutationObserver(queueRefresh);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    refreshNodes();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    reducedMotion.addEventListener?.("change", onMotionPreference);
    finePointer.addEventListener?.("change", onResize);
    compactViewport.addEventListener?.("change", onResize);

    return () => {
      root.classList.remove("bcPremiumParallax");
      mutationObserver.disconnect();
      nodes.forEach(clearNode);
      clearSceneVariables(homeElement);
      if (frame) window.cancelAnimationFrame(frame);

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.visualViewport?.removeEventListener("resize", onResize);
      reducedMotion.removeEventListener?.("change", onMotionPreference);
      finePointer.removeEventListener?.("change", onResize);
      compactViewport.removeEventListener?.("change", onResize);
    };
  }, []);

  return null;
}

export default PremiumParallaxDirector;
