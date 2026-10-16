import React from "react";
import { Icons } from "@blackcrown/assets";
import { SiteHeader } from "../../components/SiteHeader";

const games = [
  { name: "Ballcrown", href: "/games/ballcrown/", detail: "Экшн" },
  { name: "EvoFish Next", href: "/game/?mode=next", detail: "Океанский мир" },
  { name: "Quiet Valley", href: "/games/quiet-valley/", detail: "Ферма · альфа" },
];

export function About() {
  return (
    <main className="platAbout">
      <SiteHeader active="about" />
      <div className="platContainer">
        <section className="platAboutHero" aria-labelledby="about-title">
          <div>
            <p className="platEyebrow">О проекте / BLACKCROWN</p>
            <h1 id="about-title" className="platAboutTitle">Несколько игр.<br />Одна BLACKCROWN.</h1>
            <p className="platAboutLead">
              BLACKCROWN — платформа, на которой у каждой игры свой характер.
              Здесь можно выбрать мир и перейти к игре прямо из браузера.
            </p>
            <a className="platButton platButtonPrimary" href="/games/">Выбрать игру <span aria-hidden="true">↗</span></a>
          </div>
          <div className="platAboutMark" aria-hidden="true">
            <img src={Icons.crown} alt="" width="180" height="180" />
            <span>BLACKCROWN</span>
          </div>
        </section>

        <section className="platAboutGrid" aria-label="Платформа BLACKCROWN">
          <div className="platAboutBlock">
            <p className="platEyebrow">01 / Игры</p>
            <h2 className="platSectionTitle">Разные миры.<br />Прямой запуск.</h2>
            <p>
              Ballcrown, EvoFish Next и Quiet Valley — самостоятельные игры.
              Каталог собирает их в одном месте: описание, текущий статус и переход к запуску.
            </p>
          </div>
          <div className="platAboutBlock">
            <p className="platEyebrow">02 / Развитие</p>
            <h2 className="platSectionTitle">Проект<br />в движении.</h2>
            <p>
              Игры и платформа продолжают развиваться. Альфа-версии отмечены в каталоге,
              чтобы перед запуском было понятно, на каком этапе находится игра.
            </p>
          </div>
        </section>

        <section className="platAboutGames" aria-labelledby="about-games-title">
          <p className="platEyebrow">Найти свой мир</p>
          <h2 id="about-games-title" className="platSectionTitle">Игры BLACKCROWN</h2>
          <div className="platAboutGameList">
            {games.map((game) => (
              <a key={game.href} href={game.href}>
                <span>{game.name}</span>
                <span className="platAboutGameDetail">{game.detail}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <a className="platAboutSupport" href="/support">Нужна помощь? Обратиться в поддержку <span aria-hidden="true">↗</span></a>
        </section>
      </div>
    </main>
  );
}
