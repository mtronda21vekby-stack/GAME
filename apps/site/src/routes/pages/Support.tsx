import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { openTelegramBot } from "../../lib/telegram";
import "../../styles/content-pages.css";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function navExternal(path: string) {
  window.location.assign(path);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.82)",
        fontWeight: 850,
        fontSize: 12,
        letterSpacing: "0.02em",
      }}
    >
      {props.children}
    </span>
  );
}

function Card(props: { title: string; desc: string; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{props.title}</div>
        {props.right}
      </div>
      <div style={{ marginTop: 10, opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>{props.desc}</div>
      {props.children ? <div style={{ marginTop: 12 }}>{props.children}</div> : null}
    </div>
  );
}

function QA(props: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.14)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          padding: 12,
          background: "transparent",
          border: "none",
          color: "var(--text)",
          cursor: "pointer",
          fontWeight: 950,
          outline: "none",
        }}
        aria-expanded={open}
      >
        <span>{props.q}</span>
        <span style={{ opacity: 0.7 }}>{open ? "—" : "+"}</span>
      </button>

      {open ? (
        <div style={{ padding: "0 12px 12px", opacity: 0.86, fontWeight: 850, lineHeight: 1.55 }}>{props.a}</div>
      ) : null}
    </div>
  );
}

export function Support() {
  const [toast, setToast] = React.useState("");
  const toastTimer = React.useRef<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }

  React.useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "auto" }}>
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </button>

          <nav className="bcNav" aria-label="Навигация">
            <a className="bcLink" href="/about">
              О проекте
            </a>
            <a className="bcLink" href="/support">
              Поддержка
            </a>
            <a className="bcLink" href="/privacy">
              Privacy
            </a>
            <a className="bcLink" href="/terms">
              Terms
            </a>
          </nav>

          <div className="bcRight">
            <Button variant="secondary" onClick={() => nav("/account")}>
              Аккаунт
            </Button>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill>Support</Pill>
              <Pill>Telegram</Pill>
              <Pill>FAQ</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              Поддержка
              <br />
              BlackCrown
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Быстрее всего — через Telegram: вопросы по аккаунту, игре, лобби и покупкам.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="primary" onClick={openTelegramBot}>
                Открыть поддержку в Telegram
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const ok = await copyText("https://t.me/GGBF6_WARZON_BOT");
                  showToast(ok ? "Ссылка скопирована" : "Не удалось скопировать");
                }}
              >
                Скопировать ссылку
              </Button>
              <Button variant="ghost" onClick={() => nav("/privacy")}>
                Privacy
              </Button>
            </div>

            {toast ? (
              <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 850, fontSize: 12 }} aria-live="polite">
                {toast}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Card
              title="Быстрые действия"
              desc="Открывай нужный модуль и прикладывай детали: никнейм, устройство, что нажал, что ожидал."
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={() => nav("/account")}>
                  Аккаунт
                </Button>
                <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
                  Lobby
                </Button>
                <Button variant="secondary" onClick={() => navExternal("/game/")}>
                  Игра
                </Button>
                <Button variant="ghost" onClick={() => nav("/store")}>
                  Store
                </Button>
              </div>
            </Card>

            <Card title="FAQ" desc="Коротко и по делу. Если вопрос не решился — пиши в Telegram.">
              <div style={{ display: "grid", gap: 10 }}>
                <QA
                  q="Где хранится профиль?"
                  a="Профиль (ник, статус, аватар и настройки) хранится локально в браузере на устройстве. Для переноса между устройствами используй экспорт/импорт в аккаунте."
                />
                <QA
                  q="Почему не открывается игра или лобби?"
                  a="Попробуй обновить страницу. На iOS проверь, что режим “Low Power” выключен, а также разрешены всплывающие окна/переходы. Если проблема повторяется — напиши в Telegram и укажи устройство и браузер."
                />
                <QA
                  q="AI-Coach в Telegram — как попасть?"
                  a="Открой бота через кнопку на сайте. На телефоне откроется Telegram, на ПК/Xbox — веб-версия. Если нужна помощь по сценариям — напиши в боте."
                />
                <QA
                  q="Покупки и доступ"
                  a="Оформление и поддержка проходят через Telegram. Если после активации что-то не применилось — напиши в Telegram и укажи ник и что именно покупал."
                />
              </div>
            </Card>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
              <a className="bcLink" href="/privacy">
                Privacy
              </a>
              <a className="bcLink" href="/terms">
                Terms
              </a>
              <a className="bcLink" href="/about">
                О проекте
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
