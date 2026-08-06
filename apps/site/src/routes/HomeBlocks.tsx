import React from "react";
import type { ContentBlock } from "../lib/contentApi";
import { Reveal, Pressable, SpringGlow } from "@blackcrown/ui";
import { sendXpEvent } from "../lib/xpClient";

type CardItem = {
  title: string;
  text?: string;
  href?: string;
};

function asCardItems(data: unknown): CardItem[] {
  if (!data || typeof data !== "object") return [];
  const any = data as any;
  const items = any.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const t = String((it as any).title ?? "");
      if (!t) return null;
      return {
        title: t,
        text: (it as any).text ? String((it as any).text) : undefined,
        href: (it as any).href ? String((it as any).href) : undefined,
      } as CardItem;
    })
    .filter(Boolean) as CardItem[];
}

export function HomeBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks?.length) return null;

  return (
    <section className="bcSection">
      <div className="bcSectionHead">
        <div className="bcSectionTitle">Updates</div>
        <div className="bcSectionSub">Свежие блоки контента из CMS.</div>
      </div>

      <div className="bcCards">
        {blocks.map((b) => {
          if (b.kind !== "cards") return null;

          const items = asCardItems(b.data);
          if (!items.length) return null;

          return (
            <React.Fragment key={b.id}>
              {items.map((it, idx) => (
                <Reveal key={`${b.id}:${idx}`}>
                  <SpringGlow className="glassStrong bc-motion" style={{ padding: 18 }}>
                    <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>{it.title}</div>
                    {it.text ? (
                      <div style={{ marginTop: 6, opacity: 0.74, fontWeight: 750, lineHeight: 1.45 }}>{it.text}</div>
                    ) : null}

                    {it.href ? (
                      <div style={{ marginTop: 12 }}>
                        <Pressable
                          as="a"
                          href={it.href}
                          className="bcAccountPill"
                          aria-label={it.title}
                          onClick={() => void sendXpEvent({ type: "cta_click", key: `block:${b.id}` })}
                        >
                          Open
                        </Pressable>
                      </div>
                    ) : null}
                  </SpringGlow>
                </Reveal>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
