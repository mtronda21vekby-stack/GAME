export type ScrollState = {
  y: number;   // px
  vy: number;  // px/s
  ts: number;  // ms
};

export type ScrollStore = {
  get: () => ScrollState;
  subscribe: (fn: (s: ScrollState) => void) => () => void;
  destroy: () => void;
};

type InitOpts = { root?: HTMLElement };

export function initScrollStore(opts: InitOpts = {}): ScrollStore {
  const root = opts.root ?? document.documentElement;

  const key = "__bc_scroll_store__";
  const existing = (root as any)[key] as ScrollStore | undefined;
  if (existing) return existing;

  let destroyed = false;
  const subs = new Set<(s: ScrollState) => void>();

  let lastY = window.scrollY || 0;
  let lastTs = performance.now();
  let pending = false;

  let raf: number | null = null;

  const state: ScrollState = {
    y: lastY,
    vy: 0,
    ts: Date.now(),
  };

  function emit() {
    subs.forEach((fn) => fn(state));
  }

  function writeCssVars() {
    root.style.setProperty("--bc-sy", `${state.y.toFixed(0)}px`);
    root.style.setProperty("--bc-svy", `${state.vy.toFixed(2)}`);
  }

  function tick(now: number) {
    raf = null;
    if (destroyed) return;
    if (!pending) return;

    const y = window.scrollY || 0;
    const dt = Math.max(8, now - lastTs);
    const dy = y - lastY;

    lastY = y;
    lastTs = now;

    state.y = y;
    state.vy = (dy / dt) * 1000;
    state.ts = Date.now();

    pending = false;
    writeCssVars();
    emit();
  }

  function schedule() {
    if (raf != null) return;
    raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    pending = true;
    schedule();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  writeCssVars();

  const store: ScrollStore = {
    get: () => state,
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    destroy: () => {
      destroyed = true;
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll as any);
      subs.clear();
      delete (root as any)[key];
    },
  };

  (root as any)[key] = store;
  return store;
}
