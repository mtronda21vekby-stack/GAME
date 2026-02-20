export type CursorState = {
  x: number;   // px
  y: number;   // px
  nx: number;  // 0..1
  ny: number;  // 0..1
  vx: number;  // px/s
  vy: number;  // px/s
  isCoarse: boolean;
  ts: number;  // ms
};

export type CursorStore = {
  get: () => CursorState;
  subscribe: (fn: (s: CursorState) => void) => () => void;
  destroy: () => void;
};

type InitOpts = {
  root?: HTMLElement; // куда писать CSS vars
};

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function isCoarsePointer() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)")?.matches;
}

export function initCursorStore(opts: InitOpts = {}): CursorStore {
  const root = opts.root ?? document.documentElement;

  // idempotent (StrictMode-safe)
  const key = "__bc_cursor_store__";
  const existing = (root as any)[key] as CursorStore | undefined;
  if (existing) return existing;

  let destroyed = false;
  const subs = new Set<(s: CursorState) => void>();

  let lastTs = performance.now();
  let lastX = window.innerWidth * 0.5;
  let lastY = window.innerHeight * 0.4;

  let pendingX = lastX;
  let pendingY = lastY;
  let hasPending = false;

  let raf: number | null = null;

  const state: CursorState = {
    x: lastX,
    y: lastY,
    nx: 0.5,
    ny: 0.4,
    vx: 0,
    vy: 0,
    isCoarse: isCoarsePointer(),
    ts: Date.now(),
  };

  function emit() {
    subs.forEach((fn) => fn(state));
  }

  function writeCssVars() {
    // px
    root.style.setProperty("--bc-cx", `${state.x.toFixed(2)}px`);
    root.style.setProperty("--bc-cy", `${state.y.toFixed(2)}px`);
    // normalized 0..1
    root.style.setProperty("--bc-cnx", `${state.nx.toFixed(5)}`);
    root.style.setProperty("--bc-cny", `${state.ny.toFixed(5)}`);
    // velocity px/s
    root.style.setProperty("--bc-cvx", `${state.vx.toFixed(2)}`);
    root.style.setProperty("--bc-cvy", `${state.vy.toFixed(2)}`);
  }

  function tick(now: number) {
    raf = null;
    if (destroyed) return;

    if (hasPending) {
      const dt = Math.max(8, now - lastTs);
      const dx = pendingX - lastX;
      const dy = pendingY - lastY;

      lastTs = now;
      lastX = pendingX;
      lastY = pendingY;

      state.x = pendingX;
      state.y = pendingY;
      state.nx = clamp01(pendingX / Math.max(1, window.innerWidth));
      state.ny = clamp01(pendingY / Math.max(1, window.innerHeight));
      state.vx = (dx / dt) * 1000;
      state.vy = (dy / dt) * 1000;
      state.isCoarse = isCoarsePointer();
      state.ts = Date.now();

      hasPending = false;
      writeCssVars();
      emit();
    }
  }

  function schedule() {
    if (raf != null) return;
    raf = requestAnimationFrame(tick);
  }

  function onMove(e: PointerEvent) {
    // Для iOS hover нет — но позицию всё равно даём
    pendingX = e.clientX;
    pendingY = e.clientY;
    hasPending = true;
    schedule();
  }

  function onTouchMove(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    pendingX = t.clientX;
    pendingY = t.clientY;
    hasPending = true;
    schedule();
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });

  // init vars once
  writeCssVars();

  const store: CursorStore = {
    get: () => state,
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    destroy: () => {
      destroyed = true;
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      subs.clear();
      delete (root as any)[key];
    },
  };

  (root as any)[key] = store;
  return store;
}
