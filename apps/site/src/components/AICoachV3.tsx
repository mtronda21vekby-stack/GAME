import React from "react";
import { Button } from "@blackcrown/ui";
import GlassSurface from "./GlassSurface";

export type AICoachV3Props = {
  onOpenCoach: () => void;
  onOpenSupport: () => void;
};

export function AICoachV3({ onOpenCoach, onOpenSupport }: AICoachV3Props) {
  return (
    <section className="bcCoachV3" aria-labelledby="bc-coach-v3-title">
      <GlassSurface className="bcCoachV3__shell" material="reactor" tone="violet">
        <div
          className="bcCoachV3__visual"
          data-bc-parallax
          data-bc-parallax-depth="7"
          data-bc-parallax-pointer="2"
          data-bc-parallax-rotate="0.14"
          data-bc-parallax-scale="0.003"
        >
          <img src="/assets/site/neon/coach.svg" alt="Нейронная корона BlackCrown AI-Coach" loading="lazy" />
          <div className="bcCoachV3__halo" aria-hidden="true" />
          <div className="bcCoachV3__nodes" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="bcCoachV3__telemetry" aria-hidden="true">
            <span>CONTEXT LINK</span>
            <strong>ACTIVE</strong>
          </div>
        </div>

        <div
          className="bcCoachV3__copy"
          data-bc-parallax
          data-bc-parallax-depth="2"
          data-bc-parallax-pointer="0.5"
          data-bc-parallax-rotate="0.04"
        >
          <div className="bcCoachV3__eyebrow">BLACKCROWN INTELLIGENCE / AI-COACH</div>
          <h2 id="bc-coach-v3-title">Игровой контекст остаётся с тобой.</h2>
          <p>
            AI-Coach помогает разбирать цели, сохраняет контекст между сессиями и возвращает пользователя в нужную точку экосистемы через Telegram.
          </p>

          <div className="bcCoachV3__features" aria-label="Возможности AI-Coach">
            <span>Strategy context</span>
            <span>Progress guidance</span>
            <span>Telegram handoff</span>
          </div>

          <div className="bcCoachV3__actions">
            <Button variant="primary" onClick={onOpenCoach}>Открыть AI-Coach</Button>
            <Button variant="ghost" onClick={onOpenSupport}>Поддержка</Button>
          </div>
        </div>
      </GlassSurface>
    </section>
  );
}

export default AICoachV3;
