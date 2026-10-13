import React from "react";
import GlassSurface from "./GlassSurface";
import "../styles/live-feed-v3.css";

type FeedCard = { title: string; desc?: string; tag?: string; href?: string; linkLabel?: string };
type FeedBlock = { id: string; title?: string; subtitle?: string; cards?: FeedCard[] };

type FeedSource = "remote" | "fallback";

const FALLBACK_BLOCKS: FeedBlock[] = [
  {
    id: "platform-fallback",
    title: "Миры и коллекция",
    subtitle: "Выбери, куда отправиться дальше.",
    cards: [
      {
        tag: "STORE",
        title: "Коллекция BlackCrown",
        desc: "Скины, бейджи и наборы. Найди предметы для своей коллекции.",
        href: "/store",
        linkLabel: "Перейти в Store",
      },
      {
        tag: "EVOFISH",
        title: "Погрузись в EvoFish",
        desc: "Океанский мир BlackCrown в отдельном игровом приложении.",
        href: "/game/",
        linkLabel: "Открыть EvoFish",
      },
      {
        tag: "CROWN//FRONT",
        title: "Crown//Front",
        desc: "Тактический мир BlackCrown в отдельном игровом приложении.",
        href: "/games/crown-front/",
        linkLabel: "Открыть Crown//Front",
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
            linkLabel: typeof item.linkLabel === "string" ? item.linkLabel : undefined,
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
        <span>BLACKCROWN / {source === "remote" ? "ОБНОВЛЕНИЯ" : "МИРЫ И СЕРВИСЫ"}</span>
        <h2 id="bc-live-v3-title">Внутри BlackCrown.</h2>
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
                  {card.href ? <a href={card.href} aria-label={card.linkLabel ?? `Открыть: ${card.title}`}>{card.linkLabel ?? "Открыть"}<span aria-hidden="true">↗</span></a> : null}
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
