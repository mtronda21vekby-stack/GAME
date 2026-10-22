import type { Camera, Material, Scene, WebGLRenderer } from "three";

export type ShaderPreparationOptions = { timeoutMs?: number; pollMs?: number };
type ReadyProgram = { program: unknown; isReady: () => boolean; getUniforms: () => unknown; getAttributes: () => unknown };
type CapturedProgram = { owner: ReadyProgram; handle: unknown };

/** The only r170-specific boundary: compile() returns materials, while readiness
 * lives on their program objects. A transparent DoubleSide material prepares both
 * BackSide and FrontSide; currentProgram holds only the last side. Snapshot every
 * cached variant once, never re-read mutable material properties from a future
 * timer (Three.compileAsync's teardown hazard).
 * If that shape changes, compile() is still submitted synchronously and false
 * reports best-effort preparation instead of claiming verified readiness. */
function capturePrograms(renderer: WebGLRenderer, materials: Set<Material>): CapturedProgram[] | null {
  const captured = new Map<ReadyProgram, CapturedProgram>();
  const properties = renderer.properties;
  if (!properties || typeof properties.get !== "function") return null;
  for (const material of materials) {
    if (typeof properties.has === "function" && !properties.has(material)) return null;
    const value = properties.get(material) as { currentProgram?: unknown; programs?: unknown } | undefined;
    if (!value?.currentProgram || !(value.programs instanceof Map) || !value.programs.size) return null;
    const variants = new Set<unknown>(value.programs.values());
    variants.add(value.currentProgram);
    for (const variant of variants) {
      const program = variant as Partial<ReadyProgram> | undefined;
      if (!program || typeof program.isReady !== "function" || typeof program.getUniforms !== "function"
        || typeof program.getAttributes !== "function" || program.program == null) return null;
      const owner = program as ReadyProgram;
      captured.set(owner, { owner, handle: owner.program });
    }
  }
  return [...captured.values()];
}

/** Submit on the caller's current render target, then poll without holding it.
 * Owners must abort BEFORE model/renderer disposal or context replacement. The
 * captured-handle check also makes an already destroyed program a safe fallback.
 * Polling is bounded; synchronous compile/reflection calls cannot be preempted.
 * False means aborted/lost/timed-out/unsupported/error, leaving native fallback
 * policy with the caller. No uncancellable Three.compileAsync timer is created. */
export function prepareSceneShaders(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  signal: AbortSignal,
  options: ShaderPreparationOptions = {},
): Promise<boolean> {
  const bounded = (value: number | undefined, fallback: number, cap: number) =>
    value !== undefined && Number.isFinite(value) && value > 0 ? Math.min(value, cap) : fallback;
  const timeout = bounded(options.timeoutMs, 2500, 60_000);
  const interval = Math.min(timeout, bounded(options.pollMs, 10, 250));
  const deadline = performance.now() + timeout;
  let context: WebGLRenderingContext | WebGL2RenderingContext;
  let programs: CapturedProgram[] | null;
  try {
    if (signal.aborted) return Promise.resolve(false);
    context = renderer.getContext();
    if (context.isContextLost()) return Promise.resolve(false);
    const materials = renderer.compile(scene, camera);
    if (signal.aborted || context.isContextLost()) return Promise.resolve(false);
    programs = capturePrograms(renderer, materials);
  } catch { return Promise.resolve(false); }
  if (!programs) return Promise.resolve(false);

  return new Promise<boolean>(resolve => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const pending = new Set(programs);
    const canvas = renderer.domElement;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      signal.removeEventListener("abort", abort);
      canvas.removeEventListener("webglcontextlost", abort);
      pending.clear();
      resolve(ready);
    };
    const abort = () => finish(false);
    const unavailable = () => signal.aborted || context.isContextLost() || renderer.getContext() !== context;
    const poll = () => {
      timer = undefined;
      if (settled) return;
      try {
        if (unavailable() || performance.now() >= deadline) { finish(false); return; }
        for (const program of pending) {
          // Abort/context checks precede every possible GL readiness query.
          if (unavailable() || program.owner.program !== program.handle || program.handle == null) { finish(false); return; }
          if (!program.owner.isReady()) { if (settled) return; continue; }
          if (settled || unavailable() || program.owner.program !== program.handle) { finish(false); return; }
          // r170 defers link validation and uniform/attribute reflection until
          // onFirstUse. Without KHR, isReady() is immediately true; do that
          // synchronous first-use work while the loading owner still prepares.
          // This does not claim to warm vertex uploads or a real draw pipeline.
          program.owner.getUniforms();
          if (settled || unavailable() || program.owner.program !== program.handle) { finish(false); return; }
          program.owner.getAttributes();
          if (settled || unavailable() || program.owner.program !== program.handle) { finish(false); return; }
          pending.delete(program);
        }
        if (unavailable()) { finish(false); return; }
        if (!pending.size) { finish(true); return; }
        timer = setTimeout(poll, Math.min(interval, Math.max(1, deadline - performance.now())));
      } catch { finish(false); }
    };
    signal.addEventListener("abort", abort, { once: true });
    canvas.addEventListener("webglcontextlost", abort, { once: true });
    poll();
  });
}
