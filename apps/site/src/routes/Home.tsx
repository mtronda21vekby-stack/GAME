import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
import BrandCore from "../components/BrandCore";
import { openTelegramBot } from "../lib/telegram";
import { Router } from "./Router";

function navSite(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function navExternal(path: string) {
  window.location.assign(path);
}

function getName() {
  return userStorage.getString("nickname", "") || "Игрок";
}

const NEXUS_ART = {
  evofish: "/assets/site/neon/evofish.svg",
  crownFront: "/assets/games/crown-front/crown-front-preview.svg",
  lobby: "/assets/site/neon/lobby.svg",
  store: "/assets/site/neon/store.svg",
  coach: "/assets/site/neon/coach.svg",
  network: "/assets/site/neon/network.svg",
} as const;

type ContentLinkKind = "site" | "external";

type ContentCard = {
  id?: string;
  title: string;
  desc?: string;
  tag?: string;
  actionLabel?: string;
  href?: string;
  kind?: ContentLinkKind;
  imageSrc?: string;
};

type ContentBlock =
  | {
      id: string;
      type: "section";
      title?: string;
      subtitle?: string;
      cards?: ContentCard[];
    }
  | {
      id: string;
      type: "cta";
      title?: string;
      subtitle?: string;
      buttons?: Array<{
        label: string;
        href: string;
        kind?: ContentLinkKind;
        variant?: "primary" | "secondary" | "ghost";
        leftIcon?: "play";
      }>;
    }
  | {
      id: string;
      type: "text";
      title?: string;
      body?: string;
    };

type PublicContentResponse = {
  blocks?: ContentBlock[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeContent(payload: unknown): PublicContentResponse {
  if (!isObject(payload)) return {};

  const blocks: ContentBlock[] = [];

  for (const rawBlock of safeArray(payload.blocks)) {
    if (!isObject(rawBlock)) continue;

    const id = typeof rawBlock.id === "string" ? rawBlock.id : "";
    const type = typeof rawBlock.type === "string" ? rawBlock.type : "";
    if (!id || (type !== "section" && type !== "cta" && type !== "text")) continue;

    if (type === "section") {
      const cards: ContentCard[] = [];

      for (const rawCard of safeArray(rawBlock.cards)) {
        if (!isObject(rawCard)) continue;
        const title = typeof rawCard.title === "string" ? rawCard.title : "";
        if (!title) continue;

        cards.push({
          id: typeof rawCard.id === "string" ? rawCard.id : undefined,
          title,
          desc: typeof rawCard.desc === "string" ? rawCard.desc : undefined,
          tag: typeof rawCard.tag === "string" ? rawCard.tag : undefined,
          actionLabel: typeof rawCard.actionLabel === "string" ? rawCard.actionLabel : undefined,
          href: typeof rawCard.href === "string" ? rawCard.href : undefined,
          kind: rawCard.kind === "external" ? "external" : "site",
          imageSrc: typeof rawCard.imageSrc === "string" ? rawCard.imageSrc : undefined,
        });
      }

      blocks.push({
        id,
        type: "section",
        title: typeof rawBlock.title === "string" ? rawBlock.title : undefined,
        subtitle: typeof rawBlock.subtitle === "string" ? rawBlock.subtitle : undefined,
        cards,
      });
      continue;
    }

    if (type === "cta") {
      const buttons: NonNullable<Extract<ContentBlock, { type: "cta" }>["buttons"]> = [];

      for (const rawButton of safeArray(rawBlock.buttons)) {
        if (!isObject(rawButton)) continue;

        const label = typeof rawButton.label === "string" ? rawButton.label : "";
        const href = typeof rawButton.href === "string" ? rawButton.href : "";
        if (!label || !href) continue;

        buttons.push({
          label,
          href,
          kind: rawButton.kind === "external" ? "external" : "site",
          variant:
            rawButton.variant === "primary" || rawButton.variant === "secondary" || rawButton.variant === "ghost"
              ? rawButton.variant
              : "secondary",
          leftIcon: rawButton.leftIcon === "play" ? "play" : undefined,
        });
      }

      blocks.push({
        id,
        type: "cta",
        title: typeof rawBlock.title === "string" ? rawBlock.title : undefined,
        subtitle: typeof rawBlock.subtitle === "string" ? rawBlock.subtitle : undefined,
        buttons,
      });
      continue;
    }

    blocks.push({
      id,
      type: "text",
      title: typeof rawBlock.title === "string" ? rawBlock.title : undefined,
      body: typeof rawBlock.body === "string" ? rawBlock.body : undefined,
    });
  }

  return { blocks };
}

const CONTENT_CACHE_KEY = "bc.publicContent.v1";
const CONTENT_CACHE_TTL = 60_000;

function readContentCache(): { at: number; payload: PublicContentResponse } | null {
  try {
    const raw = localStorage.getItem(CONTENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; payload: PublicContentResponse };
    return parsed?.at && parsed?.payload ? parsed : null;
  } catch {
    return null;
  }
}

function writeContentCache(payload: PublicContentResponse) {
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    // The page remains usable without local storage.
  }
}

function usePublicContent() {
  const [content, setContent] = React.useState<PublicContentResponse>(() => readContentCache()?.payload ?? {});

  React.useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const cached = readContentCache();
        if (cached && Date.now() - cached.at < CONTENT_CACHE_TTL) return;

        const response = await fetch("/api/content", {
          method: "GET",
          signal: controller.signal,
          headers: { accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const normalized = normalizeContent((await response.json()) as unknown);
        setContent(normalized);
        writeContentCache(normalized);
      } catch {
        // Authored brand content remains available when the endpoint is offline.
      }
    })();

    return () => controller.abort();
  }, []);

  return content;
}

function runLink(kind: ContentLinkKind, href: string) {
  if (kind === "external") navExternal(href);
  else navSite(href);
}

function scrollToWorlds() {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("worlds")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

function NavLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="bcLink bcHotLink"
      href={props.href}
      onClick={(event) => {
        event.preventDefault();
        navSite(props.href);
      }}
    >
      {props.children}
    </a>
  );
}

function StatusItem(props: { label: string; value: string; tone?: "cyan" | "orange" | "green" }) {
  return (
    <div className="bcNexusStatus__item" data-tone={props.tone ?? "cyan"}>
      <span aria-hidden="true" />
      <strong>{props.label}</strong>
      <small>{props.value}</small>
    </div>
  );
}

function WorldStage(props: {
  index: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  imageSrc: string;
  imageAlt: string;
  tone: "ocean" | "reactor";
  reverse?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <article className="bcNexusWorld" data-tone={props.tone} data-reverse={props.reverse ? "true" : "false"}>
      <div className="bcNexusWorld__copy">
        <div className="bcNexusWorld__meta">
          <span>{props.index}</span>
          <span>BLACKCROWN WORLD</span>
          <strong>{props.status}</strong>
        </div>

        <h2>{props.title}</h2>
        <div className="bcNexusWorld__subtitle">{props.subtitle}</div>
        <p>{props.description}</p>

        <div className="bcNexusWorld__actions">
          <Button variant="primary" leftIconSrc={Icons.play} onClick={props.onPrimary}>
            {props.primaryLabel}
          </Button>
          {props.secondaryLabel && props.onSecondary ? (
            <Button variant="ghost" onClick={props.onSecondary}>
              {props.secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bcNexusWorld__visual">
        <div className="bcNexusWorld__signal" aria-hidden="true" />
        <img src={props.imageSrc} alt={props.imageAlt} loading="lazy" />
        <div className="bcNexusWorld__overlay" aria-hidden="true" />
        <span className="bcNexusWorld__coordinate" aria-hidden="true">
          WORLD / {props.index}
        </span>
      </div>
    </article>
  );
}

function PlatformModule(props: {
  code: string;
  title: string;
  description: string;
  status: string;
  tone?: "cyan" | "violet" | "green";
  onClick: () => void;
}) {
  return (
    <button type="button" className="bcNexusModule" data-tone={props.tone ?? "cyan"} onClick={props.onClick}>
      <span className="bcNexusModule__code">{props.code}</span>
      <span className="bcNexusModule__copy">
        <strong>{props.title}</strong>
        <small>{props.description}</small>
      </span>
      <span className="bcNexusModule__status">{props.status}</span>
      <span className="bcNexusModule__arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

function renderUpdates(blocks: ContentBlock[]) {
  if (blocks.length === 0) return null;

  return (
    <section className="bcNexusUpdates" aria-labelledby="bc-updates-title">
      <div className="bcNexusSectionHead">
        <span>BLACKCROWN / LIVE FEED</span>
        <h2 id="bc-updates-title">Последние сигналы платформы.</h2>
        <p>Контент из публичного канала BlackCrown — без вмешательства в основную бренд-композицию.</p>
      </div>

      <div className="bcNexusUpdates__feed">
        {blocks.map((block) => {
          if (block.type === "section") {
            return (
              <article key={block.id} className="bcNexusUpdate">
                <div className="bcNexusUpdate__header">
                  <span>UPDATE</span>
                  {block.title ? <h3>{block.title}</h3> : null}
                  {block.subtitle ? <p>{block.subtitle}</p> : null}
                </div>

                {(block.cards ?? []).length ? (
                  <div className="bcNexusUpdate__cards">
                    {(block.cards ?? []).map((card, index) => (
                      <div key={card.id ?? `${block.id}-${index}`} className="bcNexusUpdate__card">
                        {card.imageSrc ? <img src={card.imageSrc} alt="" loading="lazy" /> : null}
                        <div>
                          <small>{card.tag ?? "BLACKCROWN"}</small>
                          <strong>{card.title}</strong>
                          {card.desc ? <p>{card.desc}</p> : null}
                          {card.href ? (
                            <button type="button" onClick={() => runLink(card.kind ?? "site", card.href!)}>
                              {card.actionLabel ?? "Открыть"} <span aria-hidden="true">↗</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          }

          if (block.type === "cta") {
            return (
              <article key={block.id} className="bcNexusUpdate bcNexusUpdate--cta">
                <div className="bcNexusUpdate__header">
                  <span>ACCESS</span>
                  {block.title ? <h3>{block.title}</h3> : null}
                  {block.subtitle ? <p>{block.subtitle}</p> : null}
                </div>
                <div className="bcNexusUpdate__actions">
                  {(block.buttons ?? []).map((button, index) => (
                    <Button
                      key={`${block.id}-${index}`}
                      variant={button.variant ?? "secondary"}
                      leftIconSrc={button.leftIcon === "play" ? Icons.play : undefined}
                      onClick={() => runLink(button.kind ?? "site", button.href)}
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              </article>
            );
          }

          return (
            <article key={block.id} className="bcNexusUpdate bcNexusUpdate--text">
              <div className="bcNexusUpdate__header">
                <span>BRIEF</span>
                {block.title ? <h3>{block.title}</h3> : null}
              </div>
              {block.body ? <p className="bcNexusUpdate__body">{block.body}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Home() {
  const name = getName();
  const blocks = usePublicContent().blocks ?? [];

  return (
    <main className="bcSiteRoot bcHome bcNexusHome">
      <section className="bcHero bcNexusHero">
        <div className="bcHeroBg bcNexusHero__background" aria-hidden="true">
          <div className="bcNexusHero__focus" />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" />
        </div>

        <header className="bcTop bcNexusTop">
          <button type="button" className="bcBrand bcHot" onClick={() => navSite("/")} aria-label="BlackCrown — главная">
            <span className="bcBrand__mark">
              <img alt="" src={Icons.crown} width="22" height="22" />
            </span>
            <span className="bcBrand__copy">
              <strong>BlackCrown</strong>
              <small>INTERACTIVE WORLDS</small>
            </span>
          </button>

          <nav className="bcNav" aria-label="Основная навигация">
            <button type="button" className="bcLink bcHotLink" onClick={scrollToWorlds}>
              Миры
            </button>
            <NavLink href="/about">Платформа</NavLink>
            <NavLink href="/store">Store</NavLink>
            <NavLink href="/support">Поддержка</NavLink>
          </nav>

          <div className="bcRight">
            <button type="button" className="bcAccountPill bcHot" onClick={() => navSite("/account")} aria-label="Открыть аккаунт">
              <span className="bcAccountPill__dot" aria-hidden="true" />
              <span>{name}</span>
            </button>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div className="bcNexusHero__layout">
          <div className="bcNexusHero__copy">
            <div className="bcNexusHero__eyebrow">
              <span aria-hidden="true" />
              <strong>BLACKCROWN NETWORK</strong>
              <small>ONLINE</small>
            </div>

            <h1 className="bcNexusHero__title">
              <span>BLACK</span>
              <span>CROWN</span>
            </h1>

            <p className="bcNexusHero__tagline">Одна корона. Несколько миров. Единая игровая экосистема.</p>
            <p className="bcNexusHero__lead">
              BlackCrown соединяет игры, профиль, прогресс, коллекцию и сервисы в одну цифровую точку входа. Миры меняются —
              бренд и твоя игровая идентичность остаются едиными.
            </p>

            <div className="bcNexusHero__actions">
              <Button variant="primary" onClick={() => navSite("/account")}>
                Войти в BlackCrown
              </Button>
              <Button variant="secondary" onClick={scrollToWorlds}>
                Исследовать миры
              </Button>
            </div>

            <div className="bcNexusHero__signature">
              <span>BC // NEXUS 01</span>
              <span>WEBGL · MOBILE · DESKTOP</span>
            </div>
          </div>

          <div className="bcNexusHero__core">
            <BrandCore />
          </div>
        </div>

        <div className="bcNexusStatus" aria-label="Статус экосистемы">
          <StatusItem label="EVOFISH" value="LIVE" tone="green" />
          <StatusItem label="CROWN//FRONT" value="ALPHA" tone="orange" />
          <StatusItem label="BLACKCROWN NETWORK" value="ONLINE" />
        </div>
      </section>

      <section id="worlds" className="bcNexusWorlds" aria-labelledby="bc-worlds-title">
        <div className="bcNexusSectionHead">
          <span>FEATURED WORLDS</span>
          <h2 id="bc-worlds-title">Миры внутри BlackCrown.</h2>
          <p>
            Каждая игра получает собственную атмосферу и визуальный язык. Matrix связывает их в одну экосистему, не превращая
            страницу в набор одинаковых карточек.
          </p>
        </div>

        <div className="bcNexusWorlds__stages">
          <WorldStage
            index="01"
            title="EvoFish"
            subtitle="Эволюция начинается в глубине."
            description="Исследуй океан, развивай хищника и выживай в мире, где каждый новый уровень меняет форму, скорость и стиль игры."
            status="LIVE"
            imageSrc={NEXUS_ART.evofish}
            imageAlt="EvoFish — океанский мир BlackCrown"
            tone="ocean"
            primaryLabel="Войти в EvoFish"
            onPrimary={() => navExternal("/game/")}
            secondaryLabel="О мире"
            onSecondary={() => navSite("/about")}
          />

          <WorldStage
            index="02"
            title="CROWN//FRONT"
            subtitle="Тактическая война на теле механического короля."
            description="Сражайся за контроль над живой машиной, захватывай ключевые узлы и меняй ход боя в мобильной WebGL alpha."
            status="ALPHA"
            imageSrc={NEXUS_ART.crownFront}
            imageAlt="CROWN FRONT — тактический мир BlackCrown"
            tone="reactor"
            reverse
            primaryLabel="Войти в Alpha"
            onPrimary={() => navExternal("/games/crown-front/")}
            secondaryLabel="Открыть Lobby"
            onSecondary={() => navExternal("/lobby/")}
          />
        </div>
      </section>

      <section className="bcNexusPlatform" aria-labelledby="bc-platform-title">
        <div className="bcNexusPlatform__shell">
          <div className="bcNexusPlatform__visual" aria-hidden="true">
            <img src={NEXUS_ART.network} alt="" loading="lazy" />
            <div className="bcNexusPlatform__pulse" />
          </div>

          <div className="bcNexusPlatform__copy">
            <span className="bcNexusPlatform__eyebrow">BLACKCROWN PLATFORM</span>
            <h2 id="bc-platform-title">Один профиль для всей экосистемы.</h2>
            <p>
              Переходи между играми, сохраняй коллекцию и управляй настройками без ощущения, что каждый раздел — отдельный сайт.
            </p>

            <div className="bcNexusPlatform__modules">
              <PlatformModule
                code="01"
                title="Профиль"
                description="Статус, прогресс и настройки игрока"
                status="SYNCED"
                tone="green"
                onClick={() => navSite("/account")}
              />
              <PlatformModule
                code="02"
                title="Store"
                description="Предметы, избранное и коллекция"
                status="ACTIVE"
                tone="violet"
                onClick={() => navSite("/store")}
              />
              <PlatformModule
                code="03"
                title="Lobby"
                description="Комната, ready-state и командный чат"
                status="ONLINE"
                onClick={() => navExternal("/lobby/")}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bcNexusCoach" aria-labelledby="bc-coach-title">
        <div className="bcNexusCoach__visual">
          <img src={NEXUS_ART.coach} alt="Нейронная корона BlackCrown AI-Coach" loading="lazy" />
        </div>
        <div className="bcNexusCoach__copy">
          <span>BLACKCROWN INTELLIGENCE</span>
          <h2 id="bc-coach-title">AI-Coach продолжает игру за пределами сайта.</h2>
          <p>
            Получай контекстные подсказки, разбирай игровые цели и возвращайся в нужный мир через Telegram без потери контекста.
          </p>
          <div>
            <Button variant="primary" onClick={openTelegramBot}>
              Открыть AI-Coach
            </Button>
            <Button variant="ghost" onClick={() => navSite("/support")}>
              Поддержка
            </Button>
          </div>
        </div>
      </section>

      {renderUpdates(blocks)}
    </main>
  );
}

export function App() {
  return <Router />;
}

export default Home;
