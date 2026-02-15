import React from "react";
import { Link } from "../router";

export function Support() {
  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      <div className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
        <div className="glassStrong bc-motion" style={{ padding: 18 }}>
          <div className="bc-h2">Поддержка</div>
          <div className="bc-p" style={{ marginTop: 10, maxWidth: 820 }}>
            Здесь будет центр помощи, FAQ и форма обратной связи. Пока — быстрые подсказки:
          </div>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <div className="bc-col" style={{ gap: 10, marginTop: 12 }}>
            <div className="glass" style={{ padding: 14, borderRadius: 16 }}>
              <div style={{ fontWeight: 800 }}>Игра не запускается</div>
              <div className="bc-p" style={{ marginTop: 6 }}>
                Убедись, что реальный билд EvoFish лежит в <b>apps/game/public/evofish/</b> и есть файл <b>index.html</b>.
              </div>
            </div>

            <div className="glass" style={{ padding: 14, borderRadius: 16 }}>
              <div style={{ fontWeight: 800 }}>Не открываются /game или /lobby</div>
              <div className="bc-p" style={{ marginTop: 6 }}>
                При деплое на один домен нужны пути <b>/game/</b> и <b>/lobby/</b>, и файл <b>dist/_redirects</b> (он создаётся assemble-скриптом).
              </div>
            </div>

            <div className="glass" style={{ padding: 14, borderRadius: 16 }}>
              <div style={{ fontWeight: 800 }}>Ник не сохраняется</div>
              <div className="bc-p" style={{ marginTop: 6 }}>
                Ник хранится локально (localStorage). Если включён “Private mode” или очистка данных — настройки могут сбрасываться.
              </div>
            </div>
          </div>

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
