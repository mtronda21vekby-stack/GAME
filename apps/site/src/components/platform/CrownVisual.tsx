import { useEffect, useId, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { WebGLRenderTarget } from "three";
import { PMREMGenerator } from "three/src/extras/PMREMGenerator.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PLATFORM_DEPTH_EVENT, prefersStaticPlatform, type PlatformDepthFrame } from "./usePlatformParallax";
import { disposeModel, finishMetal } from "./crownModel";

const CROWN_URL = "/experience/crown/candidate-b/crown-candidate-b-lod2.glb";

export function CrownVisual({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const gradientId = `crown-metal-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const depthScene = host.closest<HTMLElement>("[data-parallax-scene=hero]");
    const abort = new AbortController();
    let renderer: WebGLRenderer | undefined;
    let environment: WebGLRenderTarget | undefined;
    let model: Group | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let preferenceObserver: MutationObserver | undefined;
    let frame = 0;
    let lastFrame = 0;
    let depth: PlatformDepthFrame = { x: 0, y: 0, scroll: 0, compact: mobileQuery.matches, reduced: prefersStaticPlatform(motionQuery) };
    let framingSize: Vector3 | undefined;
    let inView = true;
    let released = false;
    let cancelled = false;
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 50);
    const rig = new Group();
    scene.add(rig);

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }

    function release() {
      if (released) return;
      released = true;
      stop();
      abort.abort();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      preferenceObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      mobileQuery.removeEventListener("change", resize);
      depthScene?.removeEventListener(PLATFORM_DEPTH_EVENT, onDepthFrame);
      if (renderer) {
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.remove();
      }
      if (model) disposeModel(model);
      environment?.dispose();
      scene.environment = null;
      scene.clear();
      renderer?.dispose();
      renderer?.forceContextLoss();
    }

    function fail() {
      if (cancelled || released) return;
      setStatus("fallback");
      release();
    }

    function onContextLost(event: Event) {
      event.preventDefault();
      fail();
    }

    function draw() {
      if (!renderer || !model || released) return;
      try {
        renderer.render(scene, camera);
      } catch {
        fail();
      }
    }

    function tick(now: number) {
      frame = 0;
      if (released || !inView || document.hidden) return;
      // Coalesce input frames at 30fps. There is no render loop once input settles.
      if (lastFrame && now - lastFrame < 1000 / 30 - 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;
      draw();
    }

    function applyPose() {
      const staticPose = depth.reduced || prefersStaticPlatform(motionQuery);
      const x = staticPose ? 0 : depth.x;
      const y = staticPose ? 0 : depth.y;
      const scroll = staticPose ? 0 : depth.scroll * (depth.compact ? 0.42 : 1);
      rig.rotation.set(0.055 - y * 0.09 + scroll * 0.12, -0.27 + x * 0.19, -0.045 - x * 0.025);
      rig.position.y = scroll * 0.025;
    }

    function onDepthFrame(event: Event) {
      depth = (event as CustomEvent<PlatformDepthFrame>).detail;
      applyPose();
      resume();
    }

    function resume() {
      if (released || !model || !inView || document.hidden) return;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onVisibilityChange() {
      if (document.hidden) stop();
      else resume();
    }

    function onMotionChange() {
      stop();
      applyPose();
      resume();
    }

    function resize() {
      if (!renderer || released) return;
      const width = host!.clientWidth;
      const height = host!.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.3 : 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (framingSize) {
        const size = framingSize;
        const halfFov = Math.tan((camera.fov * Math.PI) / 360);
        camera.position.set(0, 0.12, Math.max(size.y / (2 * halfFov), size.x / (2 * halfFov * camera.aspect)) * 1.2 + size.z * 0.5);
        camera.lookAt(0, 0, 0);
      }
      camera.updateProjectionMatrix();
      // A resize also refreshes a static reduced-motion frame.
      if (inView && !document.hidden) draw();
    }

    async function initialize() {
      try {
        renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);
        host!.appendChild(renderer.domElement);

        const room = new RoomEnvironment();
        const pmrem = new PMREMGenerator(renderer);
        try {
          environment = pmrem.fromScene(room, 0.04, 0.1, 100);
          scene.environment = environment.texture;
        } finally {
          room.dispose();
          pmrem.dispose();
        }
        scene.add(new HemisphereLight(0xf4f7fa, 0x111a22, 1.3));
        const key = new DirectionalLight(0xf6f6f2, 3.4);
        key.position.set(-3, 4, 5);
        const fill = new DirectionalLight(0xd4e0e8, 1.1);
        fill.position.set(4, 1, 2);
        const rim = new DirectionalLight(0x68b7c6, 2.2);
        rim.position.set(3, 2, -4);
        scene.add(key, fill, rim);

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host!);
        if ("IntersectionObserver" in window) {
          visibilityObserver = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            if (inView) resume();
            else stop();
          }, { rootMargin: "80px" });
          visibilityObserver.observe(host!);
        }
        document.addEventListener("visibilitychange", onVisibilityChange);
        motionQuery.addEventListener("change", onMotionChange);
        mobileQuery.addEventListener("change", resize);
        depthScene?.addEventListener(PLATFORM_DEPTH_EVENT, onDepthFrame);
        preferenceObserver = new MutationObserver(onMotionChange);
        preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduced-motion"] });
        resize();

        const response = await fetch(CROWN_URL, { signal: abort.signal, credentials: "same-origin" });
        if (!response.ok) throw new Error("Crown asset unavailable");
        const bytes = await response.arrayBuffer();
        if (cancelled || released) return;
        const gltf = await new GLTFLoader().parseAsync(bytes, "/experience/crown/candidate-b/");
        if (cancelled || released) {
          disposeModel(gltf.scene);
          return;
        }
        model = gltf.scene;
        finishMetal(model);
        const bounds = new Box3().setFromObject(model);
        const size = bounds.getSize(new Vector3());
        if (!Number.isFinite(size.x) || size.x <= 0) throw new Error("Empty crown asset");
        const center = bounds.getCenter(new Vector3());
        model.position.sub(center);
        rig.add(model);
        rig.rotation.set(0.055, -0.27, -0.045);
        framingSize = new Box3().setFromObject(rig).getSize(new Vector3());
        applyPose();
        resize();
        if (!released) {
          setStatus("ready");
          resume();
        }
      } catch {
        if (!cancelled) fail();
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      release();
    };
  }, []);

  return (
    <div
      className={`platCrownCanvas ${className}`.trim()}
      data-crown-state={status}
      aria-hidden="true"
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 240, pointerEvents: "none" }}
    >
      <svg
        viewBox="0 0 720 520"
        focusable="false"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: status === "ready" ? 0 : 1 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#e2e8e9" />
            <stop offset="0.25" stopColor="#78868c" />
            <stop offset="0.52" stopColor="#c3cdd1" />
            <stop offset="0.76" stopColor="#38474f" />
            <stop offset="1" stopColor="#172229" />
          </linearGradient>
        </defs>
        <g transform="translate(28 8) rotate(-5 332 260)">
          <path d="M133 329 101 194 225 258 329 139 431 258 557 194 526 329 497 365 163 365Z" fill="#18242b" stroke="#64767e" strokeWidth="1.5" />
          <path d="M133 329 101 194 225 258 329 139 431 258 557 194 526 329Z" fill={`url(#${gradientId})`} />
          <path d="m101 194 124 64-18 22-87-55ZM329 139l17 122-17 39-17-39ZM557 194l-19 31-88 55-19-22Z" fill="#e8eff0" opacity="0.24" />
          <path d="m133 329 30 36h334l29-36Z" fill="#35454e" />
          <path d="M144 332h371" stroke="#a8c3c9" strokeWidth="2" opacity="0.66" />
          <path d="M165 356h330" stroke="#67a9b6" opacity="0.55" />
        </g>
      </svg>
      <div ref={hostRef} style={{ position: "absolute", inset: 0, opacity: status === "ready" ? 1 : 0 }} />
    </div>
  );
}

export default CrownVisual;
