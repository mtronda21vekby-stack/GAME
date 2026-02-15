import React from "react";
import { Link } from "../router";

export function Terms() {
  return (
    <main className="apple-bg" style={{ minHeight: "100%" }}>
      <div className="bc-container" style={{ padding: "max(16px, env(safe-area-inset-top)) 0 44px" }}>
        <div className="glassStrong bc-motion" style={{ padding: 18 }}>
          <div className="bc-h2">Условия использования</div>

          <div className="bc-p" style={{ marginTop: 10, maxWidth: 920, lineHeight: 1.7 }}>
            Короткая версия:
          </div>

          <ul className="bc-p" style={{ marginTop: 12, lineHeight: 1.8 }}>
            <li>Сервис предоставляется “как есть”. Мы постоянно улучшаем UI/UX и стабильность.</li>
            <li>Не злоупотребляй спамом/оскорблениями в чате (даже в локальном режиме).</li>
            <li>Не пытайся ломать игру/контейнер/лобби и мешать другим пользователям.</li>
            <li>Покупки в “Store preview” сейчас отключены (заглушка).</li>
          </ul>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <div className="bc-p" style={{ opacity: 0.85, maxWidth: 920, lineHeight: 1.7 }}>
            Полная юридическая версия появится ближе к релизу сетевых функций и монетизации.
          </div>

          <div className="bc-divider" style={{ marginTop: 16 }} />

          <div className="bc-row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Link className="bc-muted" to="/">На главную →</Link>
            <Link className="bc-muted" to="/privacy">Приватность →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
