import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { openTelegramBot } from "../../lib/telegram";

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

function Card(props: {
  title: string;
  tag?: string;
  desc: string;
  bullets?: string[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  image?: string;
}) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{props.title}</div>
          {props.tag ? <Pill>{props.tag}</Pill> : null}
        </div>

        <div style={{ marginTop: 10, opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>{props.desc}</div>

        {props.bullets?.length ? (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {props.bullets.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.14)",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 999, marginTop: 6, background: "rgba(255,255,255,0.70)" }} />
                <div style={{ opacity: 0.90, fontWeight: 850, lineHeight: 1.45 }}>{b}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="primary" onClick={props.onPrimary}>
            {props.primaryLabel}
          </Button>
          {props.secondaryLabel && props.onSecondary ? (
            <Button variant="secondary" onClick={props.onSecondary}>
              {props.secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <div style={{ padding: 14, paddingTop: 0 }}>
        <img
          alt=""
          src={props.image ?? HeroArt.cardWave}
          style={{
            width: "100%",
            height: 160,
            objectFit: "cover",
            borderRadius: 18,
            border: "none",
            display: "block",
            opacity: 0.95,
          }}
        />
      </div>
    </div>
  );
}

export function Store() {
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
              <Pill>Store</Pill>
              <Pill>Пакеты</Pill>
              <Pill>Подписка</Pill>
              <Pill>Косметика</Pill>
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              Магазин
              <br />
              BlackCrown
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Премиум-пакеты и поддержка проекта. Оформление и активация — через Telegram.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="primary" onClick={openTelegramBot}>
                Открыть Store в Telegram
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
              <Button variant="ghost" onClick={() => nav("/support")}>
                Поддержка
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
            <div style={{ display: "grid", gap: 12 }}>
              <Card
                title="BlackCrown Pass"
                tag="Premium"
                desc="Премиум-доступ к сервисам и бонусам внутри экосистемы."
                bullets={[
                  "Премиум-бейдж в профиле",
                  "Приоритетная поддержка",
                  "Пакеты косметики и темы профиля",
                ]}
                primaryLabel="Оформить в Telegram"
                onPrimary={openTelegramBot}
                secondaryLabel="К аккаунту"
                onSecondary={() => nav("/account")}
                image={HeroArt.cardWave}
              />

              <Card
                title="Cosmetics Pack"
                tag="Skins"
                desc="Набор визуальных тем для профиля: градиенты, карточки и эффекты."
                bullets={[
                  "Темы профиля и аватары",
                  "Единый стиль для сайта/лобби",
                  "Быстрое применение в аккаунте",
                ]}
                primaryLabel="Выбрать в Telegram"
                onPrimary={openTelegramBot}
                secondaryLabel="Открыть Lobby"
                onSecondary={() => navExternal("/lobby/")}
                image={HeroArt.cardWave}
              />

              <Card
                title="Supporter"
                tag="Support"
                desc="Поддержка разработки. Помогает ускорять релизы и улучшать качество."
                bullets={[
                  "Supporter-статус в профиле",
                  "Ранний доступ к обновлениям",
                  "Прямая линия в Telegram",
                ]}
                primaryLabel="Поддержать в Telegram"
                onPrimary={openTelegramBot}
                secondaryLabel="О платформе"
                onSecondary={() => nav("/about")}
                image={HeroArt.cardWave}
              />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
              <a className="bcLink" href="/privacy">
                Privacy
              </a>
              <a className="bcLink" href="/terms">
                Terms
              </a>
              <a className="bcLink" href="/support">
                Поддержка
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
