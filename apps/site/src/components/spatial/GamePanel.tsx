import { useId, type RefObject } from "react";
import { platformGames, type PlatformGame } from "../../lib/platformGames";

type Props = { game: PlatformGame; index: number; selected: boolean; onSelect: () => void; onOpen: () => void; spatial?: boolean };

/** Text, links and buttons stay native DOM, including when this surface is in perspective. */
export function GamePanel({ game, index, selected, onSelect, onOpen, spatial = false }: Props) {
  const title = useId();
  return <article className="spatialGamePanel" data-game-id={game.id} data-game-panel={spatial ? index : undefined} data-selected={selected} aria-labelledby={title} onClick={event => { if (!selected && !(event.target as Element).closest("a,button")) onSelect(); }}>
    <div className="spatialPanelHeader"><span>BC / WORLD {String(index + 1).padStart(2, "0")}</span><span className="spatialPanelState">{selected ? "ВЫБРАНО" : "ВЫБРАТЬ МИР"}<i aria-hidden="true"/></span></div>
    <div className="spatialPanelTitle"><p>{game.genre}</p><h3 id={title}>{game.title}</h3></div>
    <div className="spatialPanelOverview"><img src={game.image} alt={game.imageAlt} width="1280" height="720" loading="lazy"/><div><span className="spatialPanelStatus">{game.status}</span><p>{game.detail}</p></div></div>
    <p className="spatialPanelDescription">{game.description}</p>
    <div className="spatialPanelActions">{selected ? <><button type="button" onClick={onOpen}>Об игре <span aria-hidden="true">↗</span></button><a href={game.href}>{game.id === "crown-front" ? "Открыть альфу" : "Играть"}<span aria-hidden="true">↗</span></a></> : <button className="spatialPanelSelect" type="button" onClick={onSelect}>Выбрать {game.title}<span aria-hidden="true">→</span></button>}</div>
  </article>;
}

type LayerProps = { rootRef: RefObject<HTMLDivElement>; selected: number; visible: readonly number[]; onSelect: (index: number) => void; onOpen: () => void };
export function GamePanelLayer({ rootRef, selected, visible, onSelect, onOpen }: LayerProps) {
  return <div ref={rootRef} className="spatialPanelLayer" role="group" aria-label="Игры в пространственной галерее">{platformGames.map((game, index) => <div key={game.id} className="spatialPanelSlot" hidden={!visible.includes(index)}><GamePanel spatial game={game} index={index} selected={selected === index} onSelect={() => onSelect(index)} onOpen={onOpen}/></div>)}</div>;
}
