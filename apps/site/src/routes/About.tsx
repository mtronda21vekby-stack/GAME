import React from "react";
import { Link } from "../router";

export function About() {
  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      <div className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
        <div className="glassStrong bc-motion" style={{ padding: 18 }}>
          <div className="bc-h2">О проекте</div>
          <div className="bc-p" style={{ marginTop: 10, maxWidth: 820 }}>
            BlackCrown — это премиум-хаб для наших браузерных игр: быстрый лендинг, контейнер игры и лобби с чатом.
            Мы делаем “Apple-like” интерфейс: много воздуха, стеклянные панели, мягкие тени и микродвижение (120fps-friendly).
          </div>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <ul className="bc-p" style={{ marginTop: 12, lineHeight: 1.75 }}>
            <li><b>Site</b> — лендинг, страницы политики, roadmap/changelog, превью магазина.</li>
            <li><b>Game</b> — контейнер EvoFish: запуск, настройки, fullscreen, контроллеры.</li>
            <li><b>Lobby</b> — список игроков, ready/unready, чат на 8 игроков (пока локальный mock).</li>
          </ul>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <div className="bc-row" style={{ gap: 12, flexWrap: "wrap" }}>
            <a className="bc-muted" href="/game/">Перейти в игру →</a>
            <a className="bc-muted" href="/lobby/">Перейти в лобби →</a>
            <Link className="bc-muted" to="/">На главную →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
