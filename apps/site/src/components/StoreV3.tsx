import React from "react";
import { Button } from "@blackcrown/ui";
import GlassSurface from "./GlassSurface";
import "../styles/store-v3.css";

export type StoreV3Props = {
  onOpenStore: () => void;
  onOpenAccount: () => void;
};

const FEATURES = [
  ["COLLECTION", "Скины, предметы и цифровые награды в одном месте."],
  ["SYNC", "Покупки и избранное синхронизируются с профилем."],
  ["DROPS", "Ограниченные серии и события BlackCrown."],
] as const;

export function StoreV3({ onOpenStore, onOpenAccount }: StoreV3Props) {
  return (
    <section className="bcStoreV3" aria-labelledby="bc-store-v3-title">
      <GlassSurface material="metal" tone="orange" className="bcStoreV3__shell">
        <div className="bcStoreV3__copy">
          <span className="bcStoreV3__eyebrow">BLACKCROWN STORE / PREMIUM ACCESS</span>
          <h2 id="bc-store-v3-title">Твоя коллекция — часть экосистемы.</h2>
          <p>
            Store объединяет предметы, избранное и цифровые награды без ощущения отдельного магазина.
          </p>

          <div className="bcStoreV3__features">
            {FEATURES.map(([title, text], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </article>
            ))}
          </div>

          <div className="bcStoreV3__actions">
            <Button variant="primary" onClick={onOpenStore}>Открыть Store</Button>
            <Button variant="ghost" onClick={onOpenAccount}>Моя коллекция</Button>
          </div>
        </div>

        <div className="bcStoreV3__visual" aria-hidden="true">
          <div className="bcStoreV3__orb" />
          <div className="bcStoreV3__ring bcStoreV3__ring--one" />
          <div className="bcStoreV3__ring bcStoreV3__ring--two" />
          <div className="bcStoreV3__card bcStoreV3__card--front">BC / DROP 01</div>
          <div className="bcStoreV3__card bcStoreV3__card--back">COLLECTION SYNC</div>
        </div>
      </GlassSurface>
    </section>
  );
}

export default StoreV3;
