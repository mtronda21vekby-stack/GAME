export type FrameLoopCallback = (activeTime: number) => void;

/** Injectable browser boundary; constructing/importing a loop never touches the DOM. */
export type FrameLoopHost = {
  now: () => number;
  request: (callback: (wallTime: number) => void) => number;
  cancel: (id: number) => void;
  hidden: () => boolean;
  onVisibilityChange: (callback: () => void) => () => void;
  reportError?: (error: unknown) => void;
};

export type FrameLoopSnapshot = {
  queued: number;
  labels: string[];
  nativeFramePending: boolean;
  hidden: boolean;
  activeTime: number;
  frames: number;
  callbacks: number;
};

function browserHost(): FrameLoopHost {
  return {
    now: () => performance.now(),
    request: callback => window.requestAnimationFrame(callback),
    cancel: id => window.cancelAnimationFrame(id),
    hidden: () => document.hidden,
    onVisibilityChange(callback) {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    reportError(error) {
      // One failed owner must not suppress another owner's pending frame.
      if (typeof globalThis.reportError === "function") globalThis.reportError(error);
      else setTimeout(() => { throw error; }, 0);
    },
  };
}

/** One native RAF for all one-shot clients, on a clock that excludes hidden time. */
export class FrameLoop {
  private host?: FrameLoopHost;
  private detach?: () => void;
  private nextId = 1;
  private readonly pending = new Map<number, { callback: FrameLoopCallback; label: string }>();
  private nativeFrame: number | null = null;
  private hiddenAt: number | null = null;
  private hiddenDuration = 0;
  private lastActiveTime = 0;
  private dispatchTime: number | null = null;
  private dispatching = false;
  private frameCount = 0;
  private callbackCount = 0;
  private disposed = false;

  constructor(private readonly suppliedHost?: FrameLoopHost) {}

  private connect() {
    if (this.disposed) throw new Error("FrameLoop has been disposed");
    if (!this.host) {
      this.host = this.suppliedHost ?? browserHost();
      if (this.host.hidden()) this.hiddenAt = this.host.now();
      this.detach = this.host.onVisibilityChange(this.visibilityChanged);
    }
    return this.host;
  }

  private visibilityChanged = () => {
    const host = this.host;
    if (!host || this.disposed) return;
    const wallTime = host.now();
    if (host.hidden()) {
      if (this.hiddenAt === null) this.hiddenAt = wallTime;
      if (this.nativeFrame !== null) host.cancel(this.nativeFrame);
      this.nativeFrame = null;
    } else {
      if (this.hiddenAt !== null) this.hiddenDuration += Math.max(0, wallTime - this.hiddenAt);
      this.hiddenAt = null;
      this.schedule();
    }
  };

  now() {
    if (this.dispatchTime !== null) return this.dispatchTime;
    const host = this.connect();
    // A host can change visibility immediately before its event is delivered.
    if (host.hidden() !== (this.hiddenAt !== null)) this.visibilityChanged();
    const active = (this.hiddenAt ?? host.now()) - this.hiddenDuration;
    this.lastActiveTime = Math.max(this.lastActiveTime, active);
    return this.lastActiveTime;
  }

  request(callback: FrameLoopCallback, label = "animation") {
    this.connect();
    const id = this.nextId++;
    this.pending.set(id, { callback, label });
    this.schedule();
    return id;
  }

  cancel(id: number) {
    this.pending.delete(id);
    if (!this.pending.size && this.nativeFrame !== null) {
      this.host?.cancel(this.nativeFrame);
      this.nativeFrame = null;
    }
  }

  private schedule() {
    const host = this.host;
    if (!host || this.disposed || !this.pending.size || this.nativeFrame !== null || this.dispatching || host.hidden()) return;
    this.nativeFrame = host.request(this.flush);
  }

  private flush = (wallTime: number) => {
    this.nativeFrame = null;
    const host = this.host;
    if (!host || this.disposed) return;
    if (host.hidden()) { this.visibilityChanged(); return; }
    this.dispatching = true;
    if (this.hiddenAt !== null) this.visibilityChanged();
    this.lastActiveTime = Math.max(this.lastActiveTime, wallTime - this.hiddenDuration);
    this.dispatchTime = this.lastActiveTime;
    this.frameCount += 1;
    const due = [...this.pending.keys()];
    try {
      for (const id of due) {
        if (host.hidden()) break;
        const entry = this.pending.get(id);
        if (!entry) continue;
        this.pending.delete(id);
        this.callbackCount += 1;
        try { entry.callback(this.dispatchTime); }
        catch (error) { host.reportError?.(error); }
      }
    } finally {
      this.dispatchTime = null;
      this.dispatching = false;
      this.schedule();
    }
  };

  snapshot(): FrameLoopSnapshot {
    const activeTime = this.now();
    return {
      queued: this.pending.size,
      labels: [...this.pending.values()].map(entry => entry.label),
      nativeFramePending: this.nativeFrame !== null,
      hidden: this.hiddenAt !== null,
      activeTime,
      frames: this.frameCount,
      callbacks: this.callbackCount,
    };
  }

  /** For a separately owned/test loop; scene owners only cancel their own ids. */
  dispose() {
    if (this.nativeFrame !== null) this.host?.cancel(this.nativeFrame);
    this.nativeFrame = null;
    this.pending.clear();
    this.detach?.();
    this.detach = undefined;
    this.disposed = true;
  }
}

export const frameLoop = new FrameLoop();
