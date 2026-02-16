import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function About() {
  return (
    <main className="bcSiteRoot">
      <section className="bcHero">
        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </button>

          <nav className="bcNav" aria-label="Навигация">
            <a className="bcLink" href="/">Главная</a>
            <a className="bcLink" href="/support">Поддержка</a>
            <a className="bcLink" href="/privacy">Privacy</a>
            <a className="bcLink" href="/terms">Terms</a>
          </nav>

          <div className="bcRight">
            <Button variant="secondary" onClick={() => nav("/game/")}>
              Перейти к играм
            </Button>
          </div>
        </header>

        <div className="bcHeroGrid">
          <div className="bcHeroCopy glassStrong">
            <div className="bcKicker">О платформе</div>
            <h1 className="bcH1">BlackCrown</h1>

            <p className="bcLead">
              Это единый хаб для наших игр: запуск, настройки, аккаунт и социальные функции.
              Сейчас доступна <b>EvoFish</b>, дальше — новые тайтлы и события.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => nav("/game/")}>
                Запустить EvoFish
              </Button>
              <Button variant="secondary" onClick={() => nav("/lobby/")}>
                Открыть Lobby
              </Button>
            </div>
          </div>

          <div className="bcHeroPanel glassStrong">
            <div className="bcPanelTitle">Навигация</div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Главная</div>
                <div className="bcPanelP">Хаб и быстрый запуск.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/support")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Поддержка</div>
                <div className="bcPanelP">Контакты и помощь.</div>
              </div>
            </div>

            <div className="bcPanelRow" role="button" tabIndex={0} onClick={() => nav("/account")}>
              <div className="bcDot" />
              <div>
                <div className="bcPanelH">Аккаунт</div>
                <div className="bcPanelP">Ник и профиль.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
