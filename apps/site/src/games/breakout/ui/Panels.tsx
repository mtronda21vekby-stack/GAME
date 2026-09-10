import React from "react";
import type { GameSnapshot, ItemId } from "../domain";
import { RECIPES, canCraft } from "../gameplay/crafting";
import { ITEM_DEFINITIONS } from "../gameplay/items";
import type { BreakoutStore } from "../simulation/BreakoutStore";
import { NPCS } from "../world/blueprint";

type Panel = "inventory" | "craft" | "contacts" | "plan";

const routeCopy = {
  maintenance: {
    title: "SERVICE LINE",
    subtitle: "Технический выход",
    steps: ["Найти щётку и зажигалку", "Сделать пластиковый ключ", "Открыть служебную дверь", "Найти отвёртку", "Открыть технический люк"],
  },
  roof: {
    title: "HIGH GROUND",
    subtitle: "Побег через крышу",
    steps: ["Найти напильник", "Найти изоленту", "Сделать усиленный резак", "Получить форму охраны", "Перекусить сетку и выйти к лестнице"],
  },
  tunnel: {
    title: "OLD DRAIN",
    subtitle: "Старый дренаж",
    steps: ["Добыть ложку", "Ночью раскопать слабый пол 3 раза", "Сделать верёвку из двух простыней", "Спуститься в дренаж"],
  },
} as const;

export function GamePanel({ panel, state, store, onClose }: { panel: Panel; state: GameSnapshot; store: BreakoutStore; onClose: () => void }) {
  return (
    <div className="bcBreakoutOverlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="bcBreakoutPanel" role="dialog" aria-modal="true">
        <button className="bcBreakoutPanel__close" onClick={onClose} aria-label="Закрыть">×</button>
        {panel === "inventory" ? <InventoryPanel state={state} store={store} /> : null}
        {panel === "craft" ? <CraftPanel state={state} store={store} /> : null}
        {panel === "contacts" ? <ContactsPanel state={state} /> : null}
        {panel === "plan" ? <PlanPanel state={state} /> : null}
      </section>
    </div>
  );
}

function InventoryPanel({ state, store }: { state: GameSnapshot; store: BreakoutStore }) {
  const carried = (Object.entries(state.inventory) as [ItemId, number][]).filter(([, quantity]) => quantity > 0);
  const stashed = (Object.entries(state.stash) as [ItemId, number][]).filter(([, quantity]) => quantity > 0);
  return <>
    <div className="bcBreakoutEyebrow">PERSONAL PROPERTY</div>
    <h2>Инвентарь</h2>
    <p className="bcBreakoutPanel__lead">Красные предметы считаются контрабандой и будут конфискованы при обыске.</p>
    <div className="bcBreakoutInventoryGrid">
      {carried.length ? carried.map(([id, quantity]) => {
        const item = ITEM_DEFINITIONS[id];
        return <article className={item.contraband ? "is-contraband" : ""} key={id}>
          <span>{item.icon}</span><div><b>{item.name} ×{quantity}</b><small>{item.description}</small></div>
          {state.currentZone === "cellblock" ? <button onClick={() => store.stashItem(id, true)}>В тайник</button> : null}
        </article>;
      }) : <div className="bcBreakoutEmpty">Карманы пусты. Осматривай тумбочки, тележки и шкафчики.</div>}
    </div>
    <div className="bcBreakoutPanel__divider" />
    <h3>Тайник в камере</h3>
    <p className="bcBreakoutPanel__hint">Работает только в блоке C. Спрятанные вещи не конфискуются при задержании.</p>
    <div className="bcBreakoutInventoryGrid is-stash">
      {stashed.length ? stashed.map(([id, quantity]) => <article key={id}>
        <span>{ITEM_DEFINITIONS[id].icon}</span><div><b>{ITEM_DEFINITIONS[id].name} ×{quantity}</b><small>Спрятано за стеновой панелью.</small></div>
        {state.currentZone === "cellblock" ? <button onClick={() => store.stashItem(id, false)}>Забрать</button> : null}
      </article>) : <div className="bcBreakoutEmpty">Тайник пока пуст.</div>}
    </div>
  </>;
}

function CraftPanel({ state, store }: { state: GameSnapshot; store: BreakoutStore }) {
  return <>
    <div className="bcBreakoutEyebrow">WORKBENCH KNOWLEDGE</div>
    <h2>Крафт</h2>
    <p className="bcBreakoutPanel__lead">Рецепты доступны сразу, но требуют компонентов и достаточного интеллекта.</p>
    <div className="bcBreakoutRecipeList">
      {RECIPES.map((recipe) => {
        const ready = canCraft(recipe, state.inventory, state.intelligence);
        return <article key={recipe.id} className={ready ? "is-ready" : ""}>
          <header><span>{ITEM_DEFINITIONS[recipe.result].icon}</span><div><b>{recipe.name}</b><small>ИНТ. {recipe.intelligence}</small></div></header>
          <p>{recipe.description}</p>
          <div className="bcBreakoutIngredients">
            {(Object.entries(recipe.ingredients) as [ItemId, number][]).map(([id, quantity]) => <span key={id} className={state.inventory[id] >= quantity ? "has" : ""}>{ITEM_DEFINITIONS[id].name} {state.inventory[id]}/{quantity}</span>)}
          </div>
          <button disabled={!ready} onClick={() => store.craft(recipe.id)}>{ready ? "СОЗДАТЬ" : "НЕ ХВАТАЕТ"}</button>
        </article>;
      })}
    </div>
  </>;
}

function ContactsPanel({ state }: { state: GameSnapshot }) {
  return <>
    <div className="bcBreakoutEyebrow">BLACKRIDGE SOCIAL MAP</div>
    <h2>Люди</h2>
    <p className="bcBreakoutPanel__lead">Отношения открывают альтернативные способы получить доступ, предметы и информацию.</p>
    <div className="bcBreakoutContacts">
      {NPCS.filter((npc) => ["marco", "rook", "nico", "hayes", "miller", "cole"].includes(npc.id)).map((npc) => <article key={npc.id}>
        <span className="bcBreakoutContactAvatar" style={{ background: `#${npc.color.toString(16).padStart(6, "0")}` }}>{npc.name.slice(0, 1)}</span>
        <div><b>{npc.name}</b><small>{npc.role.toUpperCase()} · СВЯЗЬ {state.relationships[npc.id] ?? 0}</small><p>{npc.description}</p></div>
      </article>)}
    </div>
  </>;
}

function PlanPanel({ state }: { state: GameSnapshot }) {
  return <>
    <div className="bcBreakoutEyebrow">ESCAPE BOARD · THREE ROUTES</div>
    <h2>План побега</h2>
    <p className="bcBreakoutPanel__lead">Можно уйти любым маршрутом. Предметы и связи позволяют сокращать отдельные этапы.</p>
    <div className="bcBreakoutRoutes">
      {(Object.entries(routeCopy) as [keyof typeof routeCopy, (typeof routeCopy)[keyof typeof routeCopy]][]).map(([id, copy]) => {
        const route = state.routeProgress[id];
        return <article key={id} className={route.complete ? "is-complete" : route.discovered ? "is-discovered" : ""}>
          <small>{copy.title}</small><h3>{copy.subtitle}</h3>
          <div className="bcBreakoutRouteMeter"><i style={{ width: `${Math.round(route.progress * 100)}%` }} /></div>
          <b>{Math.round(route.progress * 100)}%</b>
          <ol>{copy.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </article>;
      })}
    </div>
  </>;
}

export function NpcDialog({ state, store }: { state: GameSnapshot; store: BreakoutStore }) {
  const npc = NPCS.find((candidate) => candidate.id === state.focusNpcId);
  if (!npc) return null;
  return <div className="bcBreakoutOverlay is-dialog">
    <section className="bcBreakoutDialog" role="dialog" aria-modal="true">
      <button className="bcBreakoutPanel__close" onClick={() => store.talkTo(null)} aria-label="Закрыть">×</button>
      <span className="bcBreakoutDialog__avatar" style={{ background: `#${npc.color.toString(16).padStart(6, "0")}` }}>{npc.name.slice(0, 1)}</span>
      <div className="bcBreakoutEyebrow">{npc.role.toUpperCase()}</div>
      <h2>{npc.name}</h2>
      <p>{npc.description}</p>
      {npc.id === "rook" ? <div className="bcBreakoutShop">
        {(["lighter", "ductTape", "file", "sheet"] as ItemId[]).map((id) => <button key={id} onClick={() => store.buyFromRook(id)}><span>{ITEM_DEFINITIONS[id].icon}</span><b>{ITEM_DEFINITIONS[id].name}</b><small>{ITEM_DEFINITIONS[id].price}$</small></button>)}
      </div> : null}
      {npc.id === "marco" ? <button className="bcBreakoutPrimary" onClick={() => store.npcAction("marco")}>ПРЕДЛОЖИТЬ СДЕЛКУ</button> : null}
      {npc.id === "nico" ? <button className="bcBreakoutPrimary" onClick={() => store.npcAction("nico")}>СПРОСИТЬ ПРО ФОРМУ</button> : null}
      {npc.id === "miller" ? <button className="bcBreakoutPrimary" onClick={() => store.npcAction("miller")}>ПОДКУПИТЬ · 35$</button> : null}
      {npc.id === "hayes" ? <button className="bcBreakoutPrimary" onClick={() => store.npcAction("hayes")}>ЛЕЧЕНИЕ · 10$</button> : null}
      {npc.id === "cole" ? <div className="bcBreakoutNotice">Cole не ведёт переговоров. Пока.</div> : null}
      <footer>{state.message}</footer>
    </section>
  </div>;
}
