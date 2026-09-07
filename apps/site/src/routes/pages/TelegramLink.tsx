import React from "react";
import { Button } from "@blackcrown/ui";
import { HeroArt } from "@blackcrown/assets";
import { SiteHeader } from "../../components/SiteHeader";
import { nav } from "../../lib/nav";
import { openTelegramBot } from "../../lib/telegram";
import {
  clearTelegramLinkFragment,
  completeTelegramLink,
  getTelegramLinkStatus,
  sanitizeTelegramLinkCode,
  telegramLinkCodeFromLocation,
  type TelegramLinkStatus,
} from "../../lib/telegramLink";
import "../../styles/content-pages.css";

const EMPTY_STATUS: TelegramLinkStatus = {
  linked: false,
  premium: false,
  entitlements: [],
  linkedAt: null,
  blackCrownUserId: null,
};

type LoadState = "loading" | "ready" | "error";
type SubmitState = "idle" | "submitting" | "success" | "error";

function errorText(reason: string) {
  switch (reason) {
    case "invalid_or_expired_code":
      return "Код недействителен или уже истёк. Создай новый код в Telegram-боте.";
    case "site_already_linked":
      return "Этот аккаунт сайта уже связан с другим Telegram. Сначала отвяжи его через бота.";
    case "telegram_already_linked":
      return "Этот Telegram уже связан с другим аккаунтом BlackCrown. Сначала выполни отвязку в боте.";
    case "auth_required":
      return "Не удалось создать защищённую сессию сайта. Обнови страницу и повтори.";
    default:
      return "Сервис привязки временно недоступен. Повтори через несколько секунд.";
  }
}

function StatusBadge(props: { status: TelegramLinkStatus; state: LoadState }) {
  if (props.state === "loading") return <span style={{ opacity: 0.72 }}>Проверка статуса…</span>;
  if (props.state === "error") return <span style={{ color: "rgba(251,146,60,0.96)" }}>STATUS OFFLINE</span>;
  if (props.status.premium) return <span style={{ color: "rgba(110,231,183,0.96)" }}>PREMIUM ACTIVE</span>;
  if (props.status.linked) return <span style={{ color: "rgba(125,211,252,0.96)" }}>TELEGRAM LINKED</span>;
  return <span style={{ opacity: 0.82 }}>NOT LINKED</span>;
}

export function TelegramLink() {
  const [code, setCode] = React.useState(() => telegramLinkCodeFromLocation());
  const [status, setStatus] = React.useState<TelegramLinkStatus>(EMPTY_STATUS);
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [message, setMessage] = React.useState("");

  const refresh = React.useCallback(async (signal?: AbortSignal) => {
    setLoadState("loading");
    try {
      const next = await getTelegramLinkStatus(signal);
      setStatus(next);
      setLoadState("ready");
    } catch {
      if (!signal?.aborted) setLoadState("error");
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const submit = React.useCallback(async () => {
    const normalized = sanitizeTelegramLinkCode(code);
    if (!normalized) {
      setSubmitState("error");
      setMessage(errorText("invalid_or_expired_code"));
      return;
    }

    setSubmitState("submitting");
    setMessage("");
    try {
      const next = await completeTelegramLink(normalized);
      setStatus(next);
      setLoadState("ready");
      setSubmitState("success");
      setMessage(
        next.premium
          ? "Telegram связан. Premium подтверждён серверным entitlement."
          : "Telegram связан. Premium пока не активирован: привязка аккаунта сама по себе не является оплатой.",
      );
      setCode("");
      clearTelegramLinkFragment();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "link_failed";
      setSubmitState("error");
      setMessage(errorText(reason));
    }
  }, [code]);

  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "100vh" }}>
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <SiteHeader active="account" showLobby={true} showStoreButton={false} showAccountPill={true} />

        <div style={{ width: "min(760px, calc(100% - 28px))", margin: "0 auto", padding: "22px 0 70px" }}>
          <div
            className="glassStrong"
            style={{
              borderRadius: 26,
              padding: "clamp(18px, 4vw, 32px)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 38px 140px rgba(0,0,0,0.42)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.08)",
                  fontWeight: 950,
                  fontSize: 12,
                  letterSpacing: "0.04em",
                }}
              >
                ACCOUNT BRIDGE
              </div>
              <div style={{ fontWeight: 950, fontSize: 12, letterSpacing: "0.04em" }}>
                <StatusBadge status={status} state={loadState} />
              </div>
            </div>

            <h1 className="bcH1" style={{ marginTop: 18 }}>
              Telegram
              <br />
              + BlackCrown
            </h1>

            <p className="bcLead" style={{ marginTop: 12 }}>
              Свяжи Telegram-бота с текущим аккаунтом сайта. После этого бот сможет читать только серверно подтверждённый Premium-статус из общего Supabase GAME.
            </p>

            <div
              style={{
                marginTop: 22,
                display: "grid",
                gap: 14,
                padding: 16,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              <label htmlFor="telegram-link-code" style={{ fontWeight: 950 }}>
                Одноразовый код из Telegram
              </label>
              <input
                id="telegram-link-code"
                value={code}
                onChange={(event) => setCode(sanitizeTelegramLinkCode(event.target.value) || event.target.value.trim().slice(0, 128))}
                placeholder="Открой Premium → Связать с сайтом"
                autoComplete="one-time-code"
                spellCheck={false}
                inputMode="text"
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 15,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.07)",
                  color: "var(--text)",
                  padding: "0 14px",
                  outline: "none",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontWeight: 850,
                }}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={submit} disabled={submitState === "submitting"}>
                  {submitState === "submitting" ? "Проверка…" : "Связать аккаунты"}
                </Button>
                <Button variant="secondary" onClick={openTelegramBot}>
                  Открыть Telegram-бота
                </Button>
                <Button variant="ghost" onClick={() => void refresh()}>
                  Обновить статус
                </Button>
              </div>

              <div
                aria-live="polite"
                style={{
                  minHeight: 22,
                  fontWeight: 850,
                  color: submitState === "error" ? "rgba(251,146,60,0.96)" : "rgba(226,232,240,0.90)",
                }}
              >
                {message}
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 10, opacity: 0.82, fontWeight: 760, lineHeight: 1.55 }}>
              <div>• Код создаётся ботом, действует недолго и хранится в базе только как SHA‑256.</div>
              <div>• Привязка не выдаёт Premium и не создаёт покупку.</div>
              <div>• Premium станет активным только после появления серверного entitlement <code>bco_premium</code>.</div>
              <div>• Старые локальные или mock-покупки не могут активировать Premium в Telegram.</div>
            </div>

            {status.linked ? (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(125,211,252,0.18)",
                  background: "rgba(14,116,144,0.10)",
                  fontWeight: 850,
                }}
              >
                Связка активна. Entitlements: {status.entitlements.length ? status.entitlements.join(", ") : "нет активных"}.
              </div>
            ) : null}

            <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => nav("/account")}>
                Назад в аккаунт
              </Button>
              <Button variant="ghost" onClick={() => nav("/support")}>
                Поддержка
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
