import React from "react";
import { PlatformHeader } from "../components/platform/PlatformHeader";
import { HeroDepth } from "../components/platform/HeroDepth";
import { usePlatformParallax } from "../components/platform/usePlatformParallax";
import { platformGames, type PlatformGame } from "../lib/platformGames";

const CrownVisual = React.lazy(() => import("../components/platform/CrownVisual"));

export function GameCard({ game, index }: { game: PlatformGame; index: number }) {
  return (
    <article className="platGame" id={game.id}>
      <a className="platGameImage" href={game.href} aria-label={`Открыть ${game.title}`} data-parallax-scene="image">
        <div className="platImageDepth platDepthLayer" data-parallax-layer data-parallax-scroll="-34" data-parallax-pointer="-5"><img src={game.image} alt={game.imageAlt} loading="lazy" width="1280" height="720" /></div>
        <span className="platGameStatus">{game.status}</span>
        <span className="platImageArrow" aria-hidden="true">↗</span>
      </a>
      <div className="platGameMeta"><span>{String(index).padStart(2, "0")} / {game.genre}</span><span>{game.detail}</span></div>
      <h3><a href={game.href}>{game.title}</a></h3>
      <p>{game.description}</p>
      <a className="platTextLink" href={game.href}>{game.id === "crown-front" ? "Открыть альфу" : "Запустить игру"}<span aria-hidden="true">↗</span></a>
    </article>
  );
}

export function PlatformHome() {
  const ballcrown = platformGames[0];
  const pageRef = React.useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = React.useState(false);
  usePlatformParallax(pageRef, "", motionPaused);
  return (
    <div className="platPage" ref={pageRef}>
      <a className="platSkip" href="#main">К содержимому</a>
      <PlatformHeader />
      <main id="main">
        <section className="platHero platContainer" aria-labelledby="home-title" data-parallax-scene="hero">
          <HeroDepth />
          <div className="platHeroCopy">
            <p className="platEyebrow"><span className="platSignal" /> НЕЗАВИСИМЫЕ ИГРОВЫЕ МИРЫ</p>
            <h1 id="home-title">ТВОЯ ИГРА.<br /><span>ТВОЯ КОРОНА.</span></h1>
            <p className="platHeroLead">Разные игры. Один BLACKCROWN.<br />От арены Ballcrown до тихой долины —<br className="platDesktopBreak" /> выбирай свой мир и начинай играть.</p>
            <div className="platHeroActions">
              <a className="platButton" href="#games">Выбрать игру <span aria-hidden="true">↓</span></a>
              <a className="platTextLink" href={ballcrown.href}>Играть в Ballcrown <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="platHeroArt" aria-hidden="true">
            <div className="platOrbitDepth platDepthLayer" data-parallax-layer data-parallax-scroll="58" data-parallax-pointer="-9"><div className="platHeroOrbit" /></div>
            <div className="platCrownDepth platDepthLayer" data-parallax-layer data-parallax-scroll="104" data-parallax-pointer="18"><React.Suspense fallback={<div className="platCrownPlaceholder">♛</div>}><CrownVisual /></React.Suspense></div>
            <div className="platArtCaption"><span>BC / 01</span><span>THE CROWN</span></div>
          </div>
          <div className="platHeroBottom">
            <span>ТВОЙ СЛЕДУЮЩИЙ МИР — НИЖЕ</span>
            <div className="platSceneActions">
              <button className="platMotionToggle" type="button" aria-pressed={motionPaused} aria-label={motionPaused ? "Продолжить декоративное движение" : "Пауза декоративного движения"} onClick={() => setMotionPaused(value => !value)}><span aria-hidden="true">{motionPaused ? "▷" : "Ⅱ"}</span>{motionPaused ? "Продолжить" : "Пауза"}</button>
              <a href="/nexus-lab">Иммерсивная сцена короны <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>
        <section className="platCatalog platContainer" id="games" aria-labelledby="games-title">
          <div className="platSectionHead"><div><p className="platEyebrow">01 / ИГРЫ BLACKCROWN</p><h2 id="games-title" className="platSectionTitle">В какой мир сегодня?</h2></div><a href="/games/" className="platTextLink">Весь каталог <span aria-hidden="true">↗</span></a></div>
          <article className="platFeature" id="ballcrown">
            <a className="platFeatureImage" href={ballcrown.href} aria-label="Открыть Ballcrown" data-parallax-scene="image"><div className="platImageDepth platDepthLayer" data-parallax-layer data-parallax-scroll="-42" data-parallax-pointer="-5"><img src={ballcrown.image} alt={ballcrown.imageAlt} width="1280" height="720" loading="lazy" /></div><span className="platGameStatus">В ФОКУСЕ / BALLCROWN</span><span className="platImageArrow" aria-hidden="true">↗</span></a>
            <div className="platFeatureCopy"><p className="platEyebrow">01 / ЭКШН</p><h3>Ballcrown<span>Вступай в игру.</span></h3><p>{ballcrown.description}</p><span className="platFeatureDetail">{ballcrown.detail}</span><a className="platButton" href={ballcrown.href}>Играть в Ballcrown <span aria-hidden="true">↗</span></a></div>
          </article>
          <div className="platGameGrid">{platformGames.slice(1,3).map((game, i) => <GameCard key={game.id} game={game} index={i+2} />)}</div>
          <a className="platAlphaLink" href="/games/#crown-front"><span><small>ТАКЖЕ НА ПЛАТФОРМЕ</small><strong>CROWN//FRONT</strong></span><span>Закрытая альфа <b aria-hidden="true">↗</b></span></a>
        </section>
        <section className="platAboutTeaser platContainer" aria-labelledby="about-title"><p className="platEyebrow">02 / О ПРОЕКТЕ</p><div><h2 className="platSectionTitle" id="about-title">Разные миры.<br />Один характер.</h2><div><p>BLACKCROWN — дом для независимых игр. У каждой — свои правила, настроение и темп. Здесь можно найти следующую игру и сразу перейти к запуску.</p><a className="platTextLink" href="/about">Ближе к BLACKCROWN <span aria-hidden="true">↗</span></a></div></div></section>
      </main>
    </div>
  );
}

export function GamesCatalog() {
  React.useEffect(() => {
    if (!window.location.hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);
  const [category, setCategory] = React.useState("Все игры");
  const [query, setQuery] = React.useState("");
  const games = platformGames.filter(game => (category === "Все игры" || category === game.genre) && `${game.title} ${game.description}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru")));
  const pageRef = React.useRef<HTMLDivElement>(null);
  usePlatformParallax(pageRef, games.map(game => game.id).join(","));
  return (
    <div className="platPage" ref={pageRef}><a className="platSkip" href="#main">К содержимому</a><PlatformHeader active="games" /><main id="main" className="platCatalogPage platContainer">
      <p className="platEyebrow">КАТАЛОГ / BLACKCROWN</p><div className="platCatalogTitle"><h1>Найди свою игру.</h1><p>Арена, океан или своя долина.<br />Выбери настроение — и начинай.</p></div>
      <div className="platFilters"><div role="group" aria-label="Жанр игры">{["Все игры", "Экшн", "Исследование", "Симуляторы"].map(item => <button type="button" key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div><label className="platSearch"><span>Поиск</span><input type="search" placeholder="Название игры" value={query} onChange={event=>setQuery(event.target.value)} /></label></div>
      <p className="platResultCount" role="status">Найдено: {games.length}</p>
      <div className="platGameGrid">{games.map(game => <GameCard key={game.id} game={game} index={platformGames.indexOf(game)+1} />)}</div>
      {games.length === 0 ? <div className="platEmpty"><h2>Такой игры пока нет.</h2><p>Попробуй другое название или покажи весь каталог.</p><button type="button" className="platButton" onClick={()=>{setQuery("");setCategory("Все игры");}}>Все игры <span aria-hidden="true">↗</span></button></div> : null}
      <p className="platCatalogNote">У каждой игры — собственный интерфейс. Альфа-версии развиваются и могут содержать незавершённые механики.</p>
    </main></div>
  );
}
