import React from "react";
import type { BlockRow } from "../lib/content";

function Surface(props: { title?: string | null; children: React.ReactNode }) {
  return (
    <div className="glassStrong bc-motion bcAppear" style={{ padding: 14, borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)" }}>
      {props.title ? <div style={{ fontWeight: 950, marginBottom: 8 }}>{props.title}</div> : null}
      {props.children}
    </div>
  );
}

function CardsBlock({ b }: { b: BlockRow }) {
  const items = Array.isArray(b.data?.items) ? b.data.items : [];
  const cols = Number(b.data?.cols || 3) || 3;

  const gridCols =
    cols <= 1 ? "1fr" : cols === 2 ? ("1fr 1fr" as any) : ("1fr 1fr 1fr" as any);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {b.title ? <div style={{ fontWeight: 980, fontSize: 18 }}>{b.title}</div> : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: gridCols }}>
        {items.map((it: any, idx: number) => {
          const title = String(it?.title || "");
          const text = String(it?.text || "");
          const href = typeof it?.href === "string" ? it.href : "";

          const body = (
            <Surface title={title || null}>
              {text ? <div style={{ opacity: 0.82, fontWeight: 800, lineHeight: 1.45 }}>{text}</div> : null}
            </Surface>
          );

          return href ? (
            <a key={`${b.id}_${idx}`} href={href} className="bcAccentHover" style={{ display: "block" }}>
              {body}
            </a>
          ) : (
            <div key={`${b.id}_${idx}`}>{body}</div>
          );
        })}

        {items.length === 0 ? (
          <Surface title="Нет карточек">
            <div style={{ opacity: 0.78, fontWeight: 800 }}>Добавь items в админке: Content → JSON → items[]</div>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}

export function ContentBlocks({ blocks }: { blocks: BlockRow[] }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {blocks.map((b) => {
        if (!b?.id) return null;
        if (b.kind === "cards") return <CardsBlock key={b.id} b={b} />;
        return (
          <Surface key={b.id} title={b.title ?? b.kind}>
            <div style={{ opacity: 0.78, fontWeight: 800 }}>
              Unsupported block kind: <span style={{ fontWeight: 950 }}>{b.kind}</span>
            </div>
          </Surface>
        );
      })}
    </div>
  );
}

export default ContentBlocks;
