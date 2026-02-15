import React from "react";
import { Link } from "../router";

export function Privacy() {
  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      <div className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
        <div className="glassStrong bc-motion" style={{ padding: 18 }}>
          <div className="bc-h2">Политика приватности</div>

          <div className="bc-p" style={{ marginTop: 10, maxWidth: 900, lineHeight: 1.7 }}>
            Мы делаем local-first подход. На текущем этапе:
          </div>

          <ul className="bc-p" style={{ marginTop: 12, lineHeight: 1.8 }}>
            <li><b>Никнейм</b> сохраняется локально в браузере (localStorage) на твоём устройстве.</li>
            <li><b>Аналитика</b> — без внешних SDK. События можно логировать локально (console) для отладки.</li>
            <li><b>Чат лобби</b> сейчас работает через локальный mock (в пределах браузера/устройства).</li>
          </ul>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <div className="bc-p" style={{ opacity: 0.85, maxWidth: 900, lineHeight: 1.7 }}>
            В будущем, когда появится сервер, мы отдельно опишем, какие данные нужны для сетевой игры и как они обрабатываются.
          </div>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <div className="bc-row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Link className="bc-muted" to="/">На главную →</Link>
            <Link className="bc-muted" to="/terms">Условия →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
