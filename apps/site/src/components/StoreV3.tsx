import React from "react";
import { Button } from "@blackcrown/ui";
import GlassSurface from "./GlassSurface";
import "../styles/store-v3.css";

export type StoreV3Props = {
  onOpenStore: () => void;
  onOpenAccount: () => void;
};

const FEATURES = [
  ["Скины", "Образы для твоей коллекции."],
  ["Бейджи", "Детали игрового профиля."],
  ["Наборы", "Предметы в одной подборке."],
] as const;

export function StoreV3({ onOpenStore, onOpenAccount }: StoreV3Props) {
  return (
    <section className="bcStoreV3" aria-labelledby="bc-store-v3-title">
      <GlassSurface material="metal" tone="cyan" className="bcStoreV3__shell">
        <div className="bcStoreV3__copy">
          <span className="bcStoreV3__eyebrow">BLACKCROWN / STORE</span>
          <h2 id="bc-store-v3-title">Твоя коллекция. Твой BlackCrown.</h2>
          <p>Выбирай скины, бейджи и наборы. Сохраняй понравившееся в избранное и собирай коллекцию.</p>

          <div className="bcStoreV3__features" aria-label="Категории Store">
            {FEATURES.map(([title, text], index) => (
              <article key={title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </article>
            ))}
          </div>

          <div className="bcStoreV3__actions">
            <Button className="bcServiceV3__button bcServiceV3__button--primary" variant="primary" onClick={onOpenStore}>Открыть Store <span aria-hidden="true">↗</span></Button>
            <Button className="bcServiceV3__button bcServiceV3__button--secondary" variant="ghost" onClick={onOpenAccount}>Мой профиль</Button>
          </div>
        </div>

        <div className="bcStoreV3__visual" aria-hidden="true">
          <img src="/assets/site/neon/store.svg" alt="" loading="lazy" width="1200" height="720" />
        </div>
      </GlassSurface>
    </section>
  );
}

export default StoreV3;
