import React from "react";
import { PrisonScene } from "./engine/PrisonScene";
import { LocalStorageSavePort } from "./persistence/save";
import { BreakoutStore } from "./simulation/BreakoutStore";
import { Hud } from "./ui/Hud";
import { GamePanel, NpcDialog } from "./ui/Panels";
import "./breakout.css";

type Panel = "inventory" | "craft" | "contacts" | "plan";

const routeNames = {
  maintenance: "SERVICE LINE",
  roof: "HIGH GROUND",
  tunnel: "OLD DRAIN",
} as const;

function useStore(store: BreakoutStore) {
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function BreakoutGame() {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const sceneRef = React.useRef<PrisonScene | null>(null);
  const store = React.useMemo(() => new BreakoutStore(new LocalStorageSavePort()), []);
  const state = useStore(store);
  const [panel, setPanel] = React.useState<Panel | null>(null);
  const [nearest, setNearest] = React.useState<string | null>(null);
  const [introOpen, setIntroOpen] = React.useState(true);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new PrisonScene(mount, store, setNearest);
    sceneRef.current = scene;
    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [store]);

  React.useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !store.getSnapshot().paused) store.togglePause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [store]);

  const begin = () => {
    setIntroOpen(false);
    store.start();
  };

  return (
    <main className="bcBreakout" data-paused={state.paused ? "true" : "false"}>
      <div className="bcBreakoutWorld" ref={mountRef} />
      <Hud state={state} nearest={nearest} onPanel={setPanel} onPause={() => store.togglePause()} />

      {panel ? <GamePanel panel={panel} state={state} store={store} onClose={() => setPanel(null)} /> : null}
      <NpcDialog state={state} store={store} />

      <div className="bcBreakoutMobileControls" aria-label="Сенсорное управление">
        <div className="bcBreakoutDpad">
          <HoldButton label="▲" onChange={(active) => sceneRef.current?.setVirtualKey("w", active)} />
          <div><HoldButton label="◀" onChange={(active) => sceneRef.current?.setVirtualKey("a", active)} /><HoldButton label="▼" onChange={(active) => sceneRef.current?.setVirtualKey("s", active)} /><HoldButton label="▶" onChange={(active) => sceneRef.current?.setVirtualKey("d", active)} /></div>
        </div>
        <div className="bcBreakoutActions">
          <HoldButton className="is-sprint" label="RUN" onChange={(active) => sceneRef.current?.setVirtualKey("sprint", active)} />
          <button className="is-interact" onClick={() => sceneRef.current?.interactNearest()}>E</button>
        </div>
      </div>

      {introOpen ? (
        <div className="bcBreakoutIntro">
          <div className="bcBreakoutIntro__noise" />
          <section>
            <div className="bcBreakoutEyebrow">BLACKRIDGE CORRECTIONAL · INTAKE 07</div>
            <span className="bcBreakoutIntro__mark">♛</span>
            <h1>BREAK<span>OUT</span></h1>
            <p>Ты в блоке C. Следуй распорядку, пока изучаешь комплекс. Торгуй, работай, прячь контрабанду и собери один из трёх маршрутов побега.</p>
            <div className="bcBreakoutIntro__tips"><span>WASD / клик — движение</span><span>E — взаимодействие</span><span>SHIFT — бег</span><span>На телефоне — экранные кнопки</span></div>
            <button onClick={begin}>{state.day === 1 && state.minute < 430 ? "НАЧАТЬ СРОК" : "ПРОДОЛЖИТЬ"}<i>↗</i></button>
            <small>Автосохранение локально · Alpha 0.1</small>
          </section>
        </div>
      ) : null}

      {state.paused && !introOpen && !state.completedRoute ? (
        <div className="bcBreakoutPause">
          <section><small>SESSION PAUSED</small><h2>Пауза</h2><button onClick={() => store.togglePause()}>ПРОДОЛЖИТЬ</button><button className="is-ghost" onClick={() => { if (window.confirm("Начать срок заново? Локальный прогресс будет удалён.")) { store.reset(); setIntroOpen(true); } }}>НАЧАТЬ ЗАНОВО</button><a href="/games/">Выйти в BLACKCROWN Games</a></section>
        </div>
      ) : null}

      {state.completedRoute ? (
        <div className="bcBreakoutEscape">
          <section>
            <div className="bcBreakoutEyebrow">BLACKRIDGE INCIDENT REPORT</div>
            <span className="bcBreakoutEscape__icon">✓</span>
            <h1>СВОБОДА</h1>
            <p>Маршрут <b>{routeNames[state.completedRoute]}</b> сработал. День {state.day}, {Math.floor(state.minute / 60).toString().padStart(2, "0")}:{Math.floor(state.minute % 60).toString().padStart(2, "0")}.</p>
            <div className="bcBreakoutEscape__stats"><span>Репутация <b>{Math.round(state.reputation)}</b></span><span>Подозрение <b>{Math.round(state.suspicion)}</b></span><span>Деньги <b>{state.money}$</b></span></div>
            <button onClick={() => { store.reset(); setIntroOpen(true); }}>НОВЫЙ ПОБЕГ</button>
            <a href="/games/">BLACKCROWN Games</a>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function HoldButton({ label, onChange, className = "" }: { label: string; onChange: (active: boolean) => void; className?: string }) {
  const release = React.useCallback(() => onChange(false), [onChange]);
  return <button
    className={className}
    onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); onChange(true); }}
    onPointerUp={release}
    onPointerCancel={release}
    onPointerLeave={release}
  >{label}</button>;
}
