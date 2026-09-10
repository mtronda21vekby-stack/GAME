import React from "react";
import type { GameSnapshot } from "../domain";
import { ITEM_DEFINITIONS, contrabandCount, countItems } from "../gameplay/items";
import { scheduleAt } from "../world/blueprint";

function formatTime(minute: number) {
  const total = Math.floor(minute) % 1440;
  const hours = Math.floor(total / 60).toString().padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function Meter({ value, tone }: { value: number; tone?: "danger" | "stamina" | "health" }) {
  return <span className={`bcBreakoutMeter ${tone ?? ""}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

export function Hud({
  state,
  nearest,
  onPanel,
  onPause,
}: {
  state: GameSnapshot;
  nearest: string | null;
  onPanel: (panel: "inventory" | "craft" | "contacts" | "plan") => void;
  onPause: () => void;
}) {
  const schedule = scheduleAt(state.minute);
  const violation = Boolean(schedule.requiredZone && schedule.requiredZone !== state.currentZone);
  const inventoryCount = countItems(state.inventory);
  const contraband = contrabandCount(state.inventory);

  return (
    <div className="bcBreakoutHud" aria-label="Игровой интерфейс">
      <header className="bcBreakoutTopbar">
        <div className="bcBreakoutBrand">
          <span className="bcBreakoutBrand__crown">♛</span>
          <span><b>BLACKCROWN // BREAKOUT</b><small>BLACKRIDGE CORRECTIONAL · BLOCK C</small></span>
        </div>
        <div className="bcBreakoutClock">
          <span>ДЕНЬ {state.day}</span>
          <b>{formatTime(state.minute)}</b>
          <small className={violation ? "is-danger" : ""}>{schedule.label}{violation ? " · ОПОЗДАНИЕ" : ""}</small>
        </div>
        <button className="bcBreakoutIconButton" onClick={onPause} aria-label={state.paused ? "Продолжить" : "Пауза"}>
          {state.paused ? "▶" : "Ⅱ"}
        </button>
      </header>

      <aside className="bcBreakoutStatus">
        <div className="bcBreakoutStatus__row"><span>Здоровье</span><b>{Math.round(state.health)}</b></div>
        <Meter value={state.health} tone="health" />
        <div className="bcBreakoutStatus__row"><span>Выносливость</span><b>{Math.round(state.stamina)}</b></div>
        <Meter value={state.stamina} tone="stamina" />
        <div className="bcBreakoutStatus__row"><span>Подозрение</span><b>{Math.round(state.suspicion)}</b></div>
        <Meter value={state.suspicion} tone="danger" />
        <div className="bcBreakoutStatus__stats">
          <span><small>РЕП.</small><b>{Math.round(state.reputation)}</b></span>
          <span><small>СИЛА</small><b>{Math.round(state.strength)}</b></span>
          <span><small>ИНТ.</small><b>{Math.round(state.intelligence)}</b></span>
          <span><small>$</small><b>{state.money}</b></span>
        </div>
      </aside>

      <aside className="bcBreakoutObjective">
        <small>ТЕКУЩИЙ РЕЖИМ</small>
        <h2>{schedule.label}</h2>
        <p>{schedule.requiredZone ? `Нужно находиться: ${schedule.requiredZone === "cellblock" ? "Блок C" : schedule.requiredZone === "canteen" ? "Столовая" : schedule.requiredZone === "laundry" ? "Прачечная" : schedule.requiredZone === "yard" ? "Двор" : schedule.requiredZone}.` : "Свободное время. Изучай комплекс, торгуй и готовь побег."}</p>
        <div className="bcBreakoutObjective__zone">СЕЙЧАС: <b>{state.currentZone.toUpperCase()}</b></div>
      </aside>

      {nearest ? <div className="bcBreakoutPrompt">⌁ {nearest}</div> : null}
      <div className="bcBreakoutMessage" role="status">{state.message}</div>

      <nav className="bcBreakoutDock" aria-label="Игровые панели">
        <button onClick={() => onPanel("inventory")}><span>▦</span><b>Инвентарь</b><small>{inventoryCount}{contraband ? ` · ${contraband} !` : ""}</small></button>
        <button onClick={() => onPanel("craft")}><span>⚒</span><b>Крафт</b><small>3 рецепта</small></button>
        <button onClick={() => onPanel("contacts")}><span>♟</span><b>Люди</b><small>Связи</small></button>
        <button onClick={() => onPanel("plan")}><span>⌖</span><b>План побега</b><small>{Object.values(state.routeProgress).filter((route) => route.discovered).length}/3</small></button>
      </nav>

      <div className="bcBreakoutHotbar" aria-label="Предметы при себе">
        {(Object.entries(state.inventory) as [keyof typeof ITEM_DEFINITIONS, number][])
          .filter(([, quantity]) => quantity > 0)
          .slice(0, 6)
          .map(([id, quantity]) => (
            <span key={id} className={ITEM_DEFINITIONS[id].contraband ? "is-contraband" : ""} title={ITEM_DEFINITIONS[id].name}>
              <i>{ITEM_DEFINITIONS[id].icon}</i><small>{quantity}</small>
            </span>
          ))}
        {!inventoryCount ? <em>Карманы пусты</em> : null}
      </div>
    </div>
  );
}
