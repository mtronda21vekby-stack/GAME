import React from "react";
import { GameRuntime, type RuntimeView } from "../engine/GameRuntime";
import { ITEM_LABELS } from "../simulation/model";
import { formatClock, minutesUntilScheduleChange, scheduleAt } from "../simulation/schedule";
import "./app.css";

function useRuntime(runtime: GameRuntime | null): RuntimeView | null {
  const [view, setView] = React.useState<RuntimeView | null>(null);
  React.useEffect(() => (runtime ? runtime.subscribe(setView) : undefined), [runtime]);
  return view;
}

function TouchControls({ runtime }: { runtime: GameRuntime }) {
  const set = (x: number, z: number) => runtime.setVirtualMovement({ x, z });
  const release = () => set(0, 0);
  const bind = (x: number, z: number) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      set(x, z);
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.buttons === 0) release();
    },
  });
  return (
    <div className="touchControls" aria-label="Сенсорное управление">
      <button className="touchControls__up" aria-label="Вверх" {...bind(0, -1)}>▲</button>
      <button className="touchControls__left" aria-label="Влево" {...bind(-1, 0)}>◀</button>
      <button className="touchControls__right" aria-label="Вправо" {...bind(1, 0)}>▶</button>
      <button className="touchControls__down" aria-label="Вниз" {...bind(0, 1)}>▼</button>
    </div>
  );
}

export function App() {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const [runtime, setRuntime] = React.useState<GameRuntime | null>(null);
  const [started, setStarted] = React.useState(false);
  const [fatal, setFatal] = React.useState<string | null>(null);
  const view = useRuntime(runtime);

  React.useEffect(() => {
    if (!started || !mountRef.current) return;
    let game: GameRuntime | null = null;
    try {
      game = new GameRuntime(mountRef.current);
      game.start();
      setRuntime(game);
    } catch (error) {
      setFatal(error instanceof Error ? error.message : String(error));
    }
    return () => {
      game?.stop();
      setRuntime(null);
    };
  }, [started]);

  const snapshot = view?.snapshot;
  const schedule = snapshot ? scheduleAt(snapshot.minuteOfDay) : null;
  const canCraft = Boolean(
    snapshot?.inventory.some((slot) => slot.itemId === "metal-strip") &&
      snapshot.inventory.some((slot) => slot.itemId === "cloth-tape") &&
      !snapshot.inventory.some((slot) => slot.itemId === "service-shim"),
  );

  return (
    <main className="breakoutApp">
      <div ref={mountRef} className="gameViewport" aria-label="Изометрический тюремный блок" />

      {!started ? (
        <section className="introPanel">
          <div className="introPanel__code">BLACKCROWN WORLD // 03</div>
          <h1>BREAKOUT</h1>
          <p className="introPanel__lead">Закрытый исправительный комплекс «Сектор 17».</p>
          <p>
            Здесь всё работает по расписанию. Отмечайся на обязательных мероприятиях, наблюдай за охраной и собирай сведения между проверками.
            Первый прототип даёт один законченный маршрут в служебный сектор.
          </p>
          <div className="introPanel__rules">
            <span><b>WASD</b> движение</span>
            <span><b>E</b> взаимодействие</span>
            <span><b>1 сек</b> = 1 игровая минута</span>
          </div>
          <button className="primaryButton" onClick={() => setStarted(true)}>ВОЙТИ В СЕКТОР 17</button>
          <a className="introPanel__back" href="/games/">← BLACKCROWN GAMES</a>
        </section>
      ) : null}

      {fatal ? (
        <section className="fatalPanel">
          <h2>3D-сцена не запустилась</h2>
          <p>{fatal}</p>
          <a href="/games/">Вернуться в BLACKCROWN Games</a>
        </section>
      ) : null}

      {started && view && snapshot && schedule ? (
        <div className="hud">
          <header className="hudTop">
            <div className="brandBlock">
              <span className="brandBlock__mark">BC</span>
              <div><strong>BREAKOUT</strong><small>SECTOR 17 · PROTOTYPE 0.1</small></div>
            </div>
            <div className="clockBlock">
              <strong>ДЕНЬ {snapshot.day} · {formatClock(snapshot.minuteOfDay)}</strong>
              <span>{schedule.label} · ещё {Math.ceil(minutesUntilScheduleChange(snapshot.minuteOfDay))} мин.</span>
            </div>
          </header>

          <aside className="objectivesPanel">
            <span className="panelEyebrow">ПЛАН // СЛУЖЕБНЫЙ МАРШРУТ</span>
            <h2>Первый выход</h2>
            <div className="objectiveList">
              {snapshot.objectives.map((objective, index) => (
                <div key={objective.id} className={`objective ${objective.completed ? "isDone" : ""}`}>
                  <span>{objective.completed ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <p>{objective.label}</p>
                </div>
              ))}
            </div>
          </aside>

          <aside className="statusPanel">
            <div className="statusPanel__row"><span>ЗОНА</span><b>{view.playerZone.toUpperCase()}</b></div>
            <div className="statusPanel__row"><span>ДЕНЬГИ</span><b>${snapshot.stats.money}</b></div>
            <div className="statusPanel__row"><span>РЕПУТАЦИЯ</span><b>{snapshot.stats.reputation}</b></div>
            <div className="meterLabel"><span>ПОДОЗРЕНИЕ</span><b>{Math.round(snapshot.stats.suspicion)}%</b></div>
            <div className="suspicionMeter"><i style={{ width: `${snapshot.stats.suspicion}%` }} /></div>
            {view.guardWatching ? <div className="watchingAlert">● ОХРАНА НАБЛЮДАЕТ</div> : null}
          </aside>

          <section className="inventoryPanel">
            <span className="panelEyebrow">КАРМАНЫ</span>
            <div className="inventorySlots">
              {snapshot.inventory.length ? snapshot.inventory.map((slot) => (
                <div className="inventorySlot" key={slot.itemId}>
                  <span>{slot.itemId === "service-shim" ? "⌁" : "▰"}</span>
                  <div><b>{ITEM_LABELS[slot.itemId]}</b><small>×{slot.quantity}</small></div>
                </div>
              )) : <div className="inventoryEmpty">Пусто</div>}
            </div>
            <button className="craftButton" disabled={!canCraft} onClick={() => runtime?.craft()}>
              {snapshot.inventory.some((slot) => slot.itemId === "service-shim") ? "СЕРВИСНЫЙ КЛЮЧ ГОТОВ" : "СОБРАТЬ СЕРВИСНЫЙ КЛЮЧ"}
            </button>
          </section>

          {view.prompt ? <button className="interactionPrompt" onClick={() => runtime?.interact()}>{view.prompt}</button> : null}
          {view.message ? <div className="toastMessage">{view.message}</div> : null}

          {snapshot.flags.firstRouteComplete ? (
            <section className="routeComplete">
              <span className="panelEyebrow">ROUTE DISCOVERED</span>
              <h2>Служебный сектор найден.</h2>
              <p>Это не побег — пока. Но теперь у тебя есть маршрут, который охрана считает закрытым.</p>
              <button className="secondaryButton" onClick={() => runtime.resetProgress()}>ПРОЙТИ ПРОТОТИП ЗАНОВО</button>
              <a href="/games/">ВЕРНУТЬСЯ В ЛОББИ</a>
            </section>
          ) : null}

          <div className="keyboardHint">WASD / стрелки · E / Space взаимодействие</div>
          <TouchControls runtime={runtime} />
          <button className="touchInteract" aria-label="Взаимодействовать" onClick={() => runtime.interact()}>E</button>
        </div>
      ) : null}
    </main>
  );
}
