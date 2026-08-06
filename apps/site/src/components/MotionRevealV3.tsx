import React from "react";
import "../styles/motion-reveal-v3.css";

const REVEAL_SELECTOR = [
  ".bcV3Hero__copy",
  ".bcV3Hero__core",
  ".bcWorldsV2__intro",
  ".bcWorldStageV2",
  ".bcPlatformV3",
  ".bcStoreV3",
  ".bcAICoachV3",
  ".bcLiveFeedV3",
  ".bcGlassSurface",
].join(",");

const AMBIENT_SELECTOR = [
  ".bcV3Hero",
  ".bcWorldStageV2[data-tone='ocean']",
  ".bcWorldStageV2[data-tone='reactor']",
  ".bcPlatformV3",
  ".bcStoreV3",
  ".bcAICoachV3",
].join(",");

type AmbientTone = "cyan" | "ocean" | "reactor" | "violet" | "neutral";

function resolveTone(element: Element): AmbientTone {
  if (element.matches(".bcWorldStageV2[data-tone='ocean']")) return "ocean";
  if (element.matches(".bcWorldStageV2[data-tone='reactor']")) return "reactor";
  if (element.matches(".bcStoreV3, .bcAICoachV3")) return "violet";
  if (element.matches(".bcPlatformV3")) return "neutral";
  return "cyan";
}

export function MotionRevealV3() {
  React.useEffect(() => {
    const root = document.documentElement;
    const reducedMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = Boolean(reducedMedia?.matches);
    const revealed = new WeakSet<Element>();
    const ambientRatios = new Map<Element, number>();

    let revealObserver: IntersectionObserver | null = null;
    let ambientObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const applyAmbient = () => {
      let bestElement: Element | null = null;
      let bestRatio = 0;

      for (const [element, ratio] of ambientRatios) {
        if (ratio > bestRatio) {
          bestElement = element;
          bestRatio = ratio;
        }
      }

      root.dataset.bcAmbient = bestElement ? resolveTone(bestElement) : "cyan";
    };

    const register = (scope: ParentNode) => {
      const nodes: HTMLElement[] = [];
      const ambientNodes: HTMLElement[] = [];

      if (scope instanceof HTMLElement && scope.matches(REVEAL_SELECTOR)) nodes.push(scope);
      nodes.push(...Array.from(scope.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)));

      if (scope instanceof HTMLElement && scope.matches(AMBIENT_SELECTOR)) ambientNodes.push(scope);
      ambientNodes.push(...Array.from(scope.querySelectorAll<HTMLElement>(AMBIENT_SELECTOR)));

      nodes.forEach((node, index) => {
        if (revealed.has(node)) return;
        revealed.add(node);
        node.classList.add("bcRevealV3");
        node.style.setProperty("--bc-reveal-delay", `${Math.min(index % 6, 5) * 45}ms`);

        if (reduced || !revealObserver) node.classList.add("is-revealed");
        else revealObserver.observe(node);
      });

      ambientNodes.forEach((node) => ambientObserver?.observe(node));
    };

    const setupObservers = () => {
      revealObserver?.disconnect();
      ambientObserver?.disconnect();
      revealObserver = null;
      ambientObserver = null;
      ambientRatios.clear();

      if (!reduced && "IntersectionObserver" in window) {
        revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-revealed");
              revealObserver?.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
        );

        ambientObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              ambientRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
            });
            applyAmbient();
          },
          { threshold: [0, 0.2, 0.4, 0.6, 0.8], rootMargin: "-18% 0px -42% 0px" }
        );
      }

      register(document);
    };

    const onMotionChange = () => {
      reduced = Boolean(reducedMedia?.matches);
      root.dataset.bcReducedMotion = reduced ? "true" : "false";
      setupObservers();
    };

    root.classList.add("bcMotionV3Ready");
    root.dataset.bcReducedMotion = reduced ? "true" : "false";
    setupObservers();

    mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) register(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    reducedMedia?.addEventListener?.("change", onMotionChange);

    return () => {
      revealObserver?.disconnect();
      ambientObserver?.disconnect();
      mutationObserver?.disconnect();
      reducedMedia?.removeEventListener?.("change", onMotionChange);
      root.classList.remove("bcMotionV3Ready");
      delete root.dataset.bcAmbient;
      delete root.dataset.bcReducedMotion;
    };
  }, []);

  return <div className="bcAmbientV3" aria-hidden="true" />;
}

export default MotionRevealV3;
