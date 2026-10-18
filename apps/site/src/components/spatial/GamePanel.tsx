import { useId, type RefObject } from "react";
import { platformGames, type PlatformGame } from "../../lib/platformGames";

type Props = { game: PlatformGame; index: number; selected: boolean; onSelect: () => void; onOpen: () => void; spatial?: boolean };

/** Text, links and buttons stay native DOM, including when this surface is in perspective. */
export function GamePanel({ game, index, selected, onSelect, onOpen, spatial = false }: Props) {
  const title = useId();
  return <article className="spatialGamePanel" data-game-id={game.id} data-game-panel={spatial ? index : undefined} data-selected={selected} aria-labelledby={title} onClick={event => { if (!selected && !(event.target as Element).closest("a,button")) onSelect(); }}>
    <img className="spatialPanelTexture" src={game.image} alt="" width="1280" height="720" loading="lazy"/>
    <div className="spatialPanelHeader"><span>BLACKCROWN / {String(index + 1).padStart(2, "0")}</span><span className="spatialPanelState" aria-label={selected ? "Выбрано" : undefined}><i aria-hidden="true"/></span></div>
    <div className="spatialPanelTitle"><p>{game.genre}</p><h3 id={title}>{game.title}</h3><span className="spatialPanelStatus">{game.status}</span></div>
    <div className="spatialPanelActions">{selected ? <><button type="button" onClick={onOpen}>Открыть <span aria-hidden="true">↗</span></button><a href={game.href}>{game.id === "crown-front" ? "Альфа" : "Играть"}<span aria-hidden="true">↗</span></a></> : <button className="spatialPanelSelect" type="button" aria-label={"Выбрать " + game.title} onClick={onSelect}>Выбрать мир<span aria-hidden="true">→</span></button>}</div>
  </article>;
}

type LayerProps = { rootRef: RefObject<HTMLDivElement>; selected: number; visible: readonly number[]; onSelect: (index: number) => void; onOpen: () => void };
export function GamePanelLayer({ rootRef, selected, visible, onSelect, onOpen }: LayerProps) {
  return <div ref={rootRef} className="spatialPanelLayer" role="group" aria-label="Игры в пространственной галерее">{platformGames.map((game, index) => <div key={game.id} className="spatialPanelSlot" hidden={!visible.includes(index)}><GamePanel spatial game={game} index={index} selected={selected === index} onSelect={() => onSelect(index)} onOpen={onOpen}/></div>)}</div>;
}
