import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function Privacy() {
  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 24 }}>
        <div className="glassStrong" style={{ maxWidth: 980, margin: "0 auto", padding: 18, borderRadius: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img alt="" src={Icons.crown} width="20" height="20" />
              <div style={{ fontWeight: 950, fontSize: 16 }}>Privacy</div>
            </div>
            <Button variant="ghost" onClick={() => nav("/")}>Главная</Button>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ opacity: 0.9, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Данные</div>
            <div>Мы сохраняем локально на устройстве только никнейм и настройки интерфейса.</div>
            <div>Серверные функции (лобби/чат) будут подключены отдельно.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
