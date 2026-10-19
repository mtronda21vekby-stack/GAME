import type { PlatformGame } from "../../lib/platformGames";
import { platformGames } from "../../lib/platformGames";

type Props = { game: PlatformGame; index: number; selected: boolean; onOpen: () => void };

/** A full native surface at every viewport size; each game always has a direct launch. */
export function GamePanel({ game, index, selected, onOpen }: Props) {
  const title = "spatial-panel-" + game.id;
  return <article className="spatialGamePanel" role="listitem" data-game-id={game.id} data-selected={selected} aria-labelledby={title}>
    <div className="spatialPanelHeader"><span>{String(index + 1).padStart(2, "0")} / {game.genre}</span><span className="spatialPanelState">{game.status}</span></div>
    <figure className="spatialPanelMedia"><img src={game.image} alt={game.imageAlt} width="1280" height="720" loading={index === 0 ? "eager" : "lazy"} decoding="async"/><span className="spatialPanelMediaMark" aria-hidden="true">↗</span></figure>
    <div className="spatialPanelBody"><div className="spatialPanelTitle"><h3 id={title}>{game.title}</h3></div><p className="spatialPanelDescription">{game.description}</p>
      <div className="spatialPanelActions">
        <button className="spatialPanelPrimary" type="button" aria-label={"Об игре " + game.title} aria-haspopup="dialog" aria-controls="spatial-game-detail" onClick={onOpen}><span className="spatialPanelActionLabel">Об игре</span><span aria-hidden="true">↗</span></button>
        <a className="spatialPanelLaunch" href={game.href} aria-label={(game.id === "crown-front" ? "Открыть альфу " : "Запустить ") + game.title}>{game.id === "crown-front" ? "Открыть альфу" : "Играть"}<span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>;
}

type GridProps = { selected: number; visible: readonly number[]; onOpen: (index: number) => void };
export function GamePanelGrid({ selected, visible, onOpen }: GridProps) {
  return <div className="spatialGameGrid" role="list" aria-label="Игры BLACKCROWN">{visible.map(index => <GamePanel key={platformGames[index].id} game={platformGames[index]} index={index} selected={selected === index} onOpen={() => onOpen(index)}/>)}</div>;
}
