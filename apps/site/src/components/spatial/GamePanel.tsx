import { useId, type RefObject } from "react";
import { platformGames, type PlatformGame } from "../../lib/platformGames";

type Props = { game: PlatformGame; index: number; selected: boolean; onSelect: () => void; onOpen: () => void; spatial?: boolean };

/** Text, links and buttons stay native DOM, including when this surface is in perspective. */
export function GamePanel({ game, index, selected, onSelect, onOpen, spatial = false }: Props) {
  const title = useId();
  return <article className="spatialGamePanel" data-game-id={game.id} data-game-panel={spatial ? index : undefined} data-selected={selected} aria-labelledby={title}>
    <div className="spatialPanelHeader"><span>{String(index + 1).padStart(2, "0")} / BLACKCROWN</span><span className="spatialPanelState">{game.status}</span></div>
    <figure className="spatialPanelMedia"><img src={game.image} alt={game.imageAlt} width="1280" height="720" loading="eager" decoding="async"/><span className="spatialPanelMediaMark" aria-hidden="true">↗</span></figure>
    <div className="spatialPanelBody"><div className="spatialPanelTitle"><p>{game.genre}</p><h3 id={title}>{game.title}</h3></div><p className="spatialPanelDescription">{game.description}</p>
    <div className="spatialPanelActions">
      <button className={"spatialPanelPrimary" + (selected ? "" : " spatialPanelSelect")} type="button" aria-label={(selected ? "Об игре " : "Выбрать ") + game.title} aria-haspopup={selected ? "dialog" : undefined} aria-controls={selected ? "spatial-game-detail" : undefined} onClick={selected ? onOpen : onSelect}><span className="spatialPanelActionLabel">{selected ? "Об игре" : "Выбрать игру"}</span><span aria-hidden="true">{selected ? "↗" : "→"}</span></button>
      {selected ? <a className="spatialPanelLaunch" href={game.href} aria-label={(game.id === "crown-front" ? "Открыть альфу " : "Запустить ") + game.title}>{game.id === "crown-front" ? "Альфа" : "Играть"}<span aria-hidden="true">↗</span></a> : null}
    </div>
    </div>
  </article>;
}

type LayerProps = { rootRef: RefObject<HTMLDivElement>; selected: number; visible: readonly number[]; onSelect: (index: number) => void; onOpen: () => void };
export function GamePanelLayer({ rootRef, selected, visible, onSelect, onOpen }: LayerProps) {
  return <div ref={rootRef} className="spatialPanelLayer" role="group" aria-label="Игры в пространственной галерее">{platformGames.map((game, index) => <div key={game.id} className="spatialPanelSlot" hidden={!visible.includes(index)}><GamePanel spatial game={game} index={index} selected={selected === index} onSelect={() => onSelect(index)} onOpen={onOpen}/></div>)}</div>;
}
