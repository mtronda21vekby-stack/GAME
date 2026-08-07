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

type PointerState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

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

/**
 * BlackCrown premium depth layer.
 *
 * The controller writes only CSS custom properties to nodes explicitly marked
 * with data-bc-parallax. Layout, navigation and hit targets stay untouched.
 * Mobile receives a reduced scroll-only treatment; fine-pointer devices also
 * get a subtle inertial pointer camera.
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
    let frame = 0;
    let geometryDirty = true;
    let pointerDirty = true;
    let refreshQueued = false;
    let viewportWidth = Math.max(1, window.innerWidth);
    let viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);

    const pointer: PointerState = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    const clearNode = (node: ParallaxNode) => {
      node.element.style.removeProperty("--bc-parallax-x");
      node.element.style.removeProperty("--bc-parallax-y");
      node.element.style.removeProperty("--bc-parallax-rx");
      node.element.style.removeProperty("--bc-parallax-ry");
      node.element.style.removeProperty("--bc-parallax-scale");
    };

    const refreshNodes = () => {
      refreshQueued = false;
      const previous = new Map(nodes.map((node) => [node.element, node]));
      const nextElements = Array.from(
        document.querySelectorAll<HTMLElement>(".bcHomeV3 [data-bc-parallax]")
      );

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

    const measureTargets = () => {
      const mobileFactor = compactViewport.matches ? 0.44 : 1;
      const pointerEnabled = finePointer.matches && !compactViewport.matches;
      const effectivePointerX = pointerEnabled ? pointer.x : 0;
      const effectivePointerY = pointerEnabled ? pointer.y : 0;

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

      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;

      if (geometryDirty || pointerDirty || finePointer.matches) {
        measureTargets();
      }

      let moving = false;
      for (const node of nodes) {
        if (writeNode(node)) moving = true;
      }

      const pointerMoving = !near(pointer.x, pointer.targetX, 0.002) || !near(pointer.y, pointer.targetY, 0.002);
      if (moving || pointerMoving) requestTick();
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
      pointer.targetX = clamp((event.clientX / viewportWidth - 0.5) * 2, -1, 1);
      pointer.targetY = clamp((event.clientY / viewportHeight - 0.5) * 2, -1, 1);
      pointerDirty = true;
      requestTick();
    };

    const onPointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
      pointerDirty = true;
      requestTick();
    };

    const onResize = () => {
      viewportWidth = Math.max(1, window.innerWidth);
      viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);
      pointer.targetX = 0;
      pointer.targetY = 0;
      geometryDirty = true;
      pointerDirty = true;
      requestTick();
    };

    const onMotionPreference = () => {
      if (reducedMotion.matches) {
        root.classList.remove("bcPremiumParallax");
        nodes.forEach(clearNode);
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
    window.addEventListener("pointerout", onPointerLeave, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    reducedMotion.addEventListener?.("change", onMotionPreference);
    finePointer.addEventListener?.("change", onResize);
    compactViewport.addEventListener?.("change", onResize);

    return () => {
      root.classList.remove("bcPremiumParallax");
      mutationObserver.disconnect();
      nodes.forEach(clearNode);
      if (frame) window.cancelAnimationFrame(frame);

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeave);
      window.visualViewport?.removeEventListener("resize", onResize);
      reducedMotion.removeEventListener?.("change", onMotionPreference);
      finePointer.removeEventListener?.("change", onResize);
      compactViewport.removeEventListener?.("change", onResize);
    };
  }, []);

  return null;
}

export default PremiumParallaxDirector;
