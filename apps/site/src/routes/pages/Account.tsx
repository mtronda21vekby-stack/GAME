import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function Account() {
  const [value, setValue] = React.useState(() => userStorage.getString("nickname", "") || "");

  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 24 }}>
        <div className="glassStrong" style={{ maxWidth: 980, margin: "0 auto", padding: 18, borderRadius: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img alt="" src={Icons.crown} width="20" height="20" />
              <div style={{ fontWeight: 950, fontSize: 16 }}>Аккаунт</div>
            </div>
            <Button variant="ghost" onClick={() => nav("/")}>Главная</Button>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Никнейм</div>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Введите никнейм"
              autoComplete="nickname"
              inputMode="text"
              style={{
                width: "100%",
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "var(--text)",
                padding: "0 12px",
                outline: "none",
                fontWeight: 850,
              }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 6 }}>
              <Button variant="secondary" onClick={() => nav("/")}>Назад</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const next = value.trim();
                  if (next.length > 0) userStorage.setString("nickname", next);
                  nav("/");
                }}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
