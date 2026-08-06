import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
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

const NEON_ART = {
  evofish: "/assets/site/neon/evofish.svg",
  crownFront: "/assets/games/crown-front/crown-front-preview.svg",
  lobby: "/assets/site/neon/lobby.svg",
  store: "/assets/site/neon/store.svg",
  coach: "/assets/site/neon/coach.svg",
  network: "/assets/site/neon/network.svg",
} as const;

/* =========================
   Public content (KV → /api/content) + cache
   ========================= */

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

  const blocksRaw = safeArray(payload.blocks);
  const blocks: ContentBlock[] = [];

  for (const rawBlock of blocksRaw) {
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

        const variant =
          rawButton.variant === "primary" || rawButton.variant === "secondary" || rawButton.variant === "ghost"
            ? rawButton.variant
            : "secondary";

        buttons.push({
          label,
          href,
          kind: rawButton.kind === "external" ? "external" : "site",
          variant,
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
    if (!parsed?.at || !parsed?.payload) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeContentCache(payload: PublicContentResponse) {
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    // Storage can be unavailable in private browsing. The page still works without the cache.
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
        // The authored fallback content below remains available when the API is offline.
      }
    })();

    return () => controller.abort();
  }, []);

  return content;
}

/* =========================
   Presentation components
   ========================= */

type PillTone = "soft" | "cyan" | "violet" | "live";
type FeatureTone = "cyan" | "violet" | "blue" | "green" | "orange";

function Pill(props: { children: React.ReactNode; tone?: PillTone }) {
  return <span className={`bcPill bcPill--${props.tone ?? "soft"}`}>{props.children}</span>;
}

function runLink(kind: ContentLinkKind, href: string) {
  if (kind === "external") navExternal(href);
  else navSite(href);
}

function FeatureCard(props: {
  title: string;
  desc: string;
  tag: string;
  actionLabel: string;
  onAction: () => void;
  href?: string;
  kind?: ContentLinkKind;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
  showOpenButton?: boolean;
  tone?: FeatureTone;
}) {
  const kind = props.kind ?? "site";

  return (
    <article
      className={`glassStrong bc-motion bcHotCard bcWorldCard ${props.className ?? ""}`.trim()}
      data-tone={props.tone ?? "cyan"}
    >
      <div className="bcWorldCard__copy">
        <div className="bcWorldCard__head">
          <div>
            <div className="bcWorldCard__index" aria-hidden="true">
              BLACKCROWN WORLD
            </div>
            <h3>{props.title}</h3>
          </div>
          <Pill tone={props.tag.toUpperCase().includes("LIVE") ? "live" : props.tone === "violet" ? "violet" : "cyan"}>
            {props.tag}
          </Pill>
        </div>

        <p>{props.desc}</p>

        <div className="bcWorldCard__actions">
          <Button variant="secondary" onClick={props.onAction}>
            {props.actionLabel}
          </Button>

          {props.href && props.showOpenButton !== false ? (
            <Button variant="ghost" onClick={() => runLink(kind, props.href!)}>
              Подробнее
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bcWorldCard__media">
        <img alt={props.imageAlt ?? ""} src={props.imageSrc ?? NEON_ART.network} loading="lazy" />
      </div>
    </article>
  );
}

function CommandRow(props: {
  code: string;
  title: string;
  description: string;
  status: string;
  tone?: "cyan" | "violet" | "green";
  onActivate: () => void;
}) {
  return (
    <button type="button" className="bcCommandRow" data-tone={props.tone ?? "cyan"} onClick={props.onActivate}>
      <span className="bcCommandRow__code">{props.code}</span>
      <span className="bcCommandRow__copy">
        <strong>{props.title}</strong>
        <small>{props.description}</small>
      </span>
      <span className="bcCommandRow__status">{props.status}</span>
      <span className="bcCommandRow__arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

function renderBlocks(blocks: ContentBlock[]) {
  return blocks.map((block) => {
    if (block.type === "section") {
      const cards = block.cards ?? [];
      if (!block.title && !block.subtitle && cards.length === 0) return null;

      return (
        <section key={block.id} className="bcSection bcCmsSection">
          <div className="bcSectionHead">
            <div className="bcSectionEyebrow">BLACKCROWN / UPDATE</div>
            {block.title ? <div className="bcSectionTitle">{block.title}</div> : null}
            {block.subtitle ? <div className="bcSectionSub">{block.subtitle}</div> : null}
          </div>

          {cards.length ? (
            <div className="bcCards">
              {cards.map((card, index) => {
                const tone: FeatureTone = index % 3 === 1 ? "violet" : index % 3 === 2 ? "blue" : "cyan";
                const tag = card.tag ?? "SYSTEM";
                const description = card.desc ?? "";
                const actionLabel = card.actionLabel ?? "Открыть";
                const kind: ContentLinkKind = card.kind ?? "site";

                if (!card.href) {
                  return (
                    <article key={card.id ?? `${block.id}-${index}`} className="glassStrong bc-motion bcNeonContentCard">
                      <div className="bcNeonContentCard__copy">
                        <div className="bcWorldCard__head">
                          <h3>{card.title}</h3>
                          <Pill tone={tone === "violet" ? "violet" : "cyan"}>{tag}</Pill>
                        </div>
                        {description ? <p>{description}</p> : null}
                      </div>
                      <img alt="" src={card.imageSrc ?? NEON_ART.network} loading="lazy" />
                    </article>
                  );
                }

                return (
                  <FeatureCard
                    key={card.id ?? `${block.id}-${index}`}
                    title={card.title}
                    desc={description}
                    tag={tag}
                    actionLabel={actionLabel}
                    onAction={() => runLink(kind, card.href!)}
                    href={card.href}
                    kind={kind}
                    imageSrc={card.imageSrc ?? NEON_ART.network}
                    tone={tone}
                  />
                );
              })}
            </div>
          ) : null}
        </section>
      );
    }

    if (block.type === "cta") {
      const buttons = block.buttons ?? [];
      if (!block.title && !block.subtitle && buttons.length === 0) return null;

      return (
        <section key={block.id} className="bcSection bcCmsSection">
          <div className="bcSectionHead">
            <div className="bcSectionEyebrow">BLACKCROWN / ACCESS</div>
            {block.title ? <div className="bcSectionTitle">{block.title}</div> : null}
            {block.subtitle ? <div className="bcSectionSub">{block.subtitle}</div> : null}
          </div>

          {buttons.length ? (
            <div className="bcCmsActions">
              {buttons.map((button, index) => {
                const leftIconSrc = button.leftIcon === "play" ? Icons.play : undefined;
                return (
                  <Button
                    key={`${block.id}-button-${index}`}
                    variant={button.variant ?? "secondary"}
                    leftIconSrc={leftIconSrc}
                    onClick={() => runLink(button.kind ?? "site", button.href)}
                  >
                    {button.label}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </section>
      );
    }

    if (!block.title && !block.body) return null;

    return (
      <section key={block.id} className="bcSection bcCmsSection">
        <div className="bcSectionHead">
          <div className="bcSectionEyebrow">BLACKCROWN / BRIEF</div>
          {block.title ? <div className="bcSectionTitle">{block.title}</div> : null}
        </div>
        {block.body ? <div className="bcCmsText">{block.body}</div> : null}
      </section>
    );
  });
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

export function Home() {
  const name = getName();
  const blocks = usePublicContent().blocks ?? [];
  const hasBlocks = blocks.length > 0;

  return (
    <main className="bcSiteRoot bcHome">
      <section className="bcHero bcNeonHero">
        <div className="bcHeroBg" aria-hidden="true">
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" />
        </div>

        <header className="bcTop">
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
            <NavLink href="/about">Платформа</NavLink>
            <NavLink href="/store">Store</NavLink>
            <NavLink href="/support">Поддержка</NavLink>
            <NavLink href="/privacy">Privacy</NavLink>
            <NavLink href="/terms">Terms</NavLink>
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

        <div className="bcHeroGrid">
          <div className="bcHeroCopy glassStrong">
            <div className="bcHeroOnline">
              <span aria-hidden="true" />
              <strong>BLACKCROWN NETWORK</strong>
              <small>ONLINE</small>
            </div>

            <div className="bcKicker">GAMING ECOSYSTEM / WEB PLATFORM</div>

            <h1 className="bcH1">
              <span className="bcH1__brand">BLACKCROWN</span>
              <span>Игровые миры</span>
              <span className="bcH1__accent">без границ.</span>
            </h1>

            <p className="bcLead">
              Единая точка входа в игры BlackCrown, профиль, коллекцию и сервисы для игроков. Погружайся в океан
              <b> EvoFish</b>, выходи на поле <b>CROWN//FRONT</b> и продолжай прогресс на любом устройстве.
            </p>

            <div className="bcCtas">
              <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
                Запустить EvoFish
              </Button>
              <Button variant="secondary" onClick={() => navExternal("/games/crown-front/")}>
                CROWN//FRONT Alpha
              </Button>
              <Button variant="secondary" onClick={() => navSite("/store")}>
                Открыть Store
              </Button>
              <Button variant="ghost" onClick={openTelegramBot}>
                AI-Coach
              </Button>
            </div>

            <div className="bcHeroStats" aria-label="Статус платформы">
              <div>
                <strong>02</strong>
                <span>игровых мира</span>
                <small>LIVE + ALPHA</small>
              </div>
              <div>
                <strong>PWA</strong>
                <span>быстрый запуск</span>
                <small>WEBGL READY</small>
              </div>
              <div>
                <strong>01</strong>
                <span>единый профиль</span>
                <small>STORE + PROGRESS</small>
              </div>
            </div>
          </div>

          <aside className="bcHeroPanel glassStrong" aria-label="Командный центр BlackCrown">
            <div className="bcPanelTop">
              <div>
                <span>BLACKCROWN</span>
                <strong>COMMAND DECK</strong>
              </div>
              <Pill tone="live">LIVE</Pill>
            </div>

            <button type="button" className="bcHeroFeature" onClick={() => navExternal("/games/crown-front/")}>
              <img src={NEON_ART.crownFront} alt="CROWN FRONT tactical reactor arena" />
              <span className="bcHeroFeature__shade" aria-hidden="true" />
              <span className="bcHeroFeature__badge">FEATURED ALPHA</span>
              <span className="bcHeroFeature__copy">
                <strong>CROWN//FRONT</strong>
                <small>Тактическая война на теле механического короля.</small>
              </span>
              <span className="bcHeroFeature__arrow" aria-hidden="true">
                ↗
              </span>
            </button>

            <div className="bcCommandList">
              <CommandRow
                code="01"
                title="EvoFish"
                description="Главный доступный мир"
                status="LIVE"
                tone="green"
                onActivate={() => navExternal("/game/")}
              />
              <CommandRow
                code="02"
                title="Lobby"
                description="Комната, ready и чат"
                status="SOCIAL"
                onActivate={() => navExternal("/lobby/")}
              />
              <CommandRow
                code="03"
                title="Store"
                description="Предметы и коллекция"
                status="SYNCED"
                tone="violet"
                onActivate={() => navSite("/store")}
              />
              <CommandRow
                code="04"
                title="AI-Coach"
                description="Стратегии в Telegram"
                status="LINKED"
                onActivate={openTelegramBot}
              />
            </div>

            <div className="bcPanelFoot">
              <span aria-hidden="true" />
              <span>ALL CORE SYSTEMS NOMINAL</span>
            </div>
          </aside>
        </div>

        <div className="bcHeroRail" aria-label="Возможности платформы">
          <span>MATRIX CORE</span>
          <span>WEBGL READY</span>
          <span>MOBILE FIRST</span>
          <span>UNIFIED PROFILE</span>
          <span>LIVE SERVICES</span>
        </div>
      </section>

      {hasBlocks ? (
        <div className="bcCmsFeed">{renderBlocks(blocks)}</div>
      ) : (
        <section className="bcSection bcWorldsSection">
          <div className="bcSectionHead">
            <div className="bcSectionEyebrow">BLACKCROWN ECOSYSTEM</div>
            <div className="bcSectionTitle">Миры и сервисы платформы.</div>
            <div className="bcSectionSub">
              Каждая часть экосистемы имеет собственную роль, но работает как единый продукт — от первого запуска до
              профиля, коллекции и командной игры.
            </div>
          </div>

          <div className="bcCards">
            <FeatureCard
              title="EvoFish"
              desc="Эволюционируй, выживай и захватывай глубины в оригинальном океанском мире BlackCrown."
              tag="LIVE"
              actionLabel="Играть сейчас"
              onAction={() => navExternal("/game/")}
              href="/game/"
              kind="external"
              imageSrc={NEON_ART.evofish}
              imageAlt="EvoFish neon ocean world"
              className="bcWorldCard--evofish"
              tone="cyan"
            />

            <FeatureCard
              title="CROWN//FRONT"
              desc="Тактическая война на теле живого механического короля. Мобильная WebGL alpha."
              tag="ALPHA"
              actionLabel="Войти в Alpha"
              onAction={() => navExternal("/games/crown-front/")}
              href="/games/crown-front/"
              kind="external"
              imageSrc={NEON_ART.crownFront}
              imageAlt="CROWN FRONT tactical reactor arena"
              className="bcCrownFrontCard bcWorldCard--crown"
              showOpenButton={false}
              tone="orange"
            />

            <FeatureCard
              title="Lobby"
              desc="Комната на восемь игроков, статус готовности и прозрачный командный чат."
              tag="SOCIAL"
              actionLabel="Открыть Lobby"
              onAction={() => navExternal("/lobby/")}
              href="/lobby/"
              kind="external"
              imageSrc={NEON_ART.lobby}
              imageAlt="BlackCrown multiplayer network"
              className="bcWorldCard--lobby"
              tone="blue"
            />

            <FeatureCard
              title="BlackCrown Store"
              desc="Цифровые предметы, наборы, избранное и единая коллекция профиля."
              tag="COLLECTION"
              actionLabel="Открыть Store"
              onAction={() => navSite("/store")}
              href="/store"
              kind="site"
              imageSrc={NEON_ART.store}
              imageAlt="BlackCrown digital collection"
              className="bcWorldCard--store"
              tone="violet"
            />

            <FeatureCard
              title="AI-Coach"
              desc="Контекстные подсказки, стратегии и работа с игровыми целями прямо в Telegram."
              tag="INTELLIGENCE"
              actionLabel="Открыть AI-Coach"
              onAction={openTelegramBot}
              imageSrc={NEON_ART.coach}
              imageAlt="BlackCrown AI Coach neural crown"
              className="bcWorldCard--coach"
              showOpenButton={false}
              tone="green"
            />
          </div>
        </section>
      )}
    </main>
  );
}

export function App() {
  return <Router />;
}

export default Home;
