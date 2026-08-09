import React from "react";
import GlassSurface from "./GlassSurface";
import "../styles/live-feed-v3.css";

type FeedCard = { title: string; desc?: string; tag?: string; href?: string };
type FeedBlock = { id: string; title?: string; subtitle?: string; cards?: FeedCard[] };

type FeedSource = "remote" | "fallback";

const FALLBACK_BLOCKS: FeedBlock[] = [
  {
    id: "platform-fallback",
    title: "BlackCrown Network",
    subtitle: "Статические сигналы показываются, когда редакционный API временно пуст или недоступен.",
    cards: [
      {
        tag: "STORE",
        title: "Новый commerce-flow",
        desc: "Корзина, серверная проверка цены, статус заказа и тестовая выдача предметов.",
        href: "/store",
      },
      {
        tag: "EVOFISH",
        title: "Океанский мир доступен",
        desc: "Запуск игрового прототипа и прогресс внутри общей экосистемы BlackCrown.",
        href: "/game/",
      },
      {
        tag: "CROWN//FRONT",
        title: "Alpha-канал открыт",
        desc: "Тактический WebGL-мир остаётся доступен через отдельное игровое приложение.",
        href: "/games/crown-front/",
      },
    ],
  },
];

function normalize(payload: unknown): FeedBlock[] {
  if (!payload || typeof payload !== "object") return [];
  const blocks = (payload as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const source = raw as Record<string, unknown>;
    const cards = Array.isArray(source.cards)
      ? source.cards.flatMap((card) => {
          if (!card || typeof card !== "object") return [];
          const item = card as Record<string, unknown>;
          if (typeof item.title !== "string") return [];
          return [{
            title: item.title,
            desc: typeof item.desc === "string" ? item.desc : undefined,
            tag: typeof item.tag === "string" ? item.tag : undefined,
            href: typeof item.href === "string" ? item.href : undefined,
          }];
        })
      : [];
    if (!cards.length && typeof source.title !== "string") return [];
    return [{
      id: typeof source.id === "string" ? source.id : `feed-${index}`,
      title: typeof source.title === "string" ? source.title : undefined,
      subtitle: typeof source.subtitle === "string" ? source.subtitle : undefined,
      cards,
    }];
  });
}

export function LiveFeedV3() {
  const [blocks, setBlocks] = React.useState<FeedBlock[]>(FALLBACK_BLOCKS);
  const [source, setSource] = React.useState<FeedSource>("fallback");

  React.useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/content", { signal: controller.signal, cache: "no-store", credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (controller.signal.aborted) return;
        const remote = normalize(payload);
        if (remote.length) {
          setBlocks(remote);
          setSource("remote");
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <section className="bcLiveFeedV3" data-source={source} aria-labelledby="bc-live-v3-title">
      <div className="bcLiveFeedV3__head">
        <span>BLACKCROWN / {source === "remote" ? "LIVE FEED" : "PLATFORM FEED"}</span>
        <h2 id="bc-live-v3-title">Последние сигналы платформы.</h2>
      </div>
      <div className="bcLiveFeedV3__grid">
        {blocks.map((block) => (
          <GlassSurface key={block.id} material="frosted" tone="cyan" className="bcLiveFeedV3__block">
            {block.title ? <h3>{block.title}</h3> : null}
            {block.subtitle ? <p>{block.subtitle}</p> : null}
            <div className="bcLiveFeedV3__cards">
              {(block.cards ?? []).map((card, index) => (
                <article key={`${block.id}-${index}`}>
                  <small>{card.tag ?? "BLACKCROWN"}</small>
                  <strong>{card.title}</strong>
                  {card.desc ? <p>{card.desc}</p> : null}
                  {card.href ? <a href={card.href}>Открыть ↗</a> : null}
                </article>
              ))}
            </div>
          </GlassSurface>
        ))}
      </div>
    </section>
  );
}

export default LiveFeedV3;
