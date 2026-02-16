import React from "react";
import { Button } from "@blackcrown/ui";
import { userStorage } from "@blackcrown/core";
import { PageShell } from "./_Layout";

function navSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function Account() {
  const [value, setValue] = React.useState(() => userStorage.getString("nickname", "") || "");
  const [saved, setSaved] = React.useState(false);

  return (
    <PageShell title="Аккаунт" subtitle="Никнейм используется в Lobby и играх.">
      <div className="glassStrong" style={{ borderRadius: 24, padding: 18 }}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Никнейм</div>

        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="Введите никнейм"
          autoComplete="nickname"
          inputMode="text"
          style={{
            width: "100%",
            height: 46,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "var(--text)",
            padding: "0 12px",
            outline: "none",
            fontWeight: 850,
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 14 }}>
          <Button variant="ghost" onClick={() => navSite("/")}>
            На главную
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              const next = value.trim();
              if (next.length > 0) userStorage.setString("nickname", next);
              setSaved(true);
            }}
          >
            Сохранить
          </Button>
        </div>

        {saved ? <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 800 }}>Сохранено</div> : null}
      </div>
    </PageShell>
  );
}
