import React from "react";
import { installWorldBridge } from "./bridge";
import { GameRuntime, type RuntimeView } from "./engine/GameRuntime";

const defaultView: RuntimeView = {
  snapshot: {
    world: "breakout",
    version: "0.1.0",
    day: 1,
    clock: "08:24",
    phase: "BREAKFAST",
    objective: "Wait for WORK or risk entering Maintenance off-schedule. Find a screwdriver.",
    player: {
      health: 100,
      stamina: 100,
      suspicion: 0,
      reputation: 0,
      money: 12,
      hasScrewdriver: false,
      powerDisabled: false,
      escaped: false,
      caughtCount: 0,
    },
  },
  log: ["DAY 01 · 08:24 — Breakfast is ending. Maintenance shift begins at 08:30."],
  interaction: null,
  alert: "clear",
};

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>{value}{suffix}</b>
    </div>
  );
}

function HoldButton({ code, children, className = "" }: { code: string; children: React.ReactNode; className?: string }) {
  const runtime = React.useContext(RuntimeContext);
  const set = (active: boolean) => runtime.current?.setVirtualInput(code, active);
  return (
    <button
      type="button"
      className={`touchKey ${className}`}
      onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); set(true); }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onPointerLeave={() => set(false)}
    >
      {children}
    </button>
  );
}

const RuntimeContext = React.createContext<React.MutableRefObject<GameRuntime | null>>({ current: null });

export function App() {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const runtimeRef = React.useRef<GameRuntime | null>(null);
  const [view, setView] = React.useState<RuntimeView>(defaultView);

  React.useEffect(() => {
    if (!mountRef.current) return;
    const runtime = new GameRuntime(mountRef.current, setView);
    runtimeRef.current = runtime;
    const uninstallBridge = installWorldBridge(() => runtime.getSnapshot());
    return () => {
      uninstallBridge();
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  const p = view.snapshot.player;
  return (
    <RuntimeContext.Provider value={runtimeRef}>
      <main className={`gameShell is-${view.alert} ${p.escaped ? "isEscaped" : ""}`}>
        <div ref={mountRef} className="world" />
        <div className="vignette" aria-hidden="true" />

        <header className="topbar">
          <div className="brand"><span>BLACKCROWN</span><b>// BREAKOUT</b><em>VERTICAL SLICE 0.1.0</em></div>
          <div className="clock"><span>DAY {view.snapshot.day.toString().padStart(2, "0")}</span><b>{view.snapshot.clock}</b><em>{view.snapshot.phase}</em></div>
          <div className="security"><span>SECURITY</span><b>{view.alert === "danger" ? "ALERT" : view.alert === "watched" ? "WATCHED" : "CLEAR"}</b><i /></div>
        </header>

        <aside className="missionPanel">
          <span className="eyebrow">ACTIVE PLAN · MAINTENANCE</span>
          <h1>GET OUT WITHOUT TRIGGERING LOCKDOWN</h1>
          <p>{view.snapshot.objective}</p>
          <div className="steps">
            <span className={p.hasScrewdriver ? "done" : "active"}><i>01</i> Take screwdriver</span>
            <span className={p.powerDisabled ? "done" : p.hasScrewdriver ? "active" : ""}><i>02</i> Kill service power</span>
            <span className={p.escaped ? "done" : p.powerDisabled ? "active" : ""}><i>03</i> Cross service gate</span>
          </div>
        </aside>

        <aside className="statsPanel">
          <div className="suspicionHead"><span>SUSPICION</span><b>{p.suspicion}%</b></div>
          <div className="suspicionTrack"><i style={{ width: `${p.suspicion}%` }} /></div>
          <div className="statGrid">
            <Stat label="HEALTH" value={p.health} />
            <Stat label="STAMINA" value={p.stamina} />
            <Stat label="REP" value={p.reputation} />
            <Stat label="CASH" value={p.money} suffix="$" />
          </div>
          <div className="inventory">
            <span>CONTRABAND</span>
            <b className={p.hasScrewdriver ? "hasItem" : ""}>{p.hasScrewdriver ? "SCREWDRIVER" : "EMPTY"}</b>
          </div>
        </aside>

        <aside className="eventLog">
          {view.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
        </aside>

        {view.interaction ? (
          <button type="button" className="interaction" onClick={() => runtimeRef.current?.interact()}>{view.interaction}</button>
        ) : null}

        <div className="desktopControls">WASD MOVE · SHIFT SPRINT · E INTERACT · R RESET</div>

        <div className="touchControls" aria-label="Touch controls">
          <div className="dpad">
            <HoldButton code="KeyW" className="up">▲</HoldButton>
            <HoldButton code="KeyA" className="left">◀</HoldButton>
            <HoldButton code="KeyD" className="right">▶</HoldButton>
            <HoldButton code="KeyS" className="down">▼</HoldButton>
          </div>
          <div className="actions">
            <HoldButton code="ShiftLeft" className="sprint">RUN</HoldButton>
            <button type="button" className="touchKey use" onClick={() => runtimeRef.current?.interact()}>USE</button>
          </div>
        </div>

        {p.escaped ? (
          <section className="escapeCard">
            <span>ROUTE COMPLETE</span>
            <h2>MAINTENANCE BREACH</h2>
            <p>You learned the schedule, stole contraband, disabled the service circuit and crossed the perimeter gate.</p>
            <div><b>+8 REP</b><b>+25$</b><b>{p.caughtCount === 0 ? "CLEAN RUN" : `${p.caughtCount} CAUGHT`}</b></div>
            <button type="button" onClick={() => runtimeRef.current?.resetRun()}>RUN AGAIN</button>
          </section>
        ) : null}
      </main>
    </RuntimeContext.Provider>
  );
}
