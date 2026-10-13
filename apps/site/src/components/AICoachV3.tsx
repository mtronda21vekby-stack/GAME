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
        <div className="bcCoachV3__visual" aria-hidden="true">
          <img src="/assets/site/neon/coach.svg" alt="" loading="lazy" width="1200" height="720" />
        </div>

        <div className="bcCoachV3__copy">
          <div className="bcCoachV3__eyebrow">BLACKCROWN / AI-COACH</div>
          <h2 id="bc-coach-v3-title">Продумай следующий ход.</h2>
          <p>Продолжай разговор о стратегии, целях и прогрессе в Telegram. AI-Coach и поддержка BlackCrown — в одном переходе.</p>

          <div className="bcCoachV3__features" aria-label="AI-Coach в Telegram">
            <span>Стратегия</span>
            <span>Игровые цели</span>
            <span>Telegram</span>
          </div>

          <div className="bcCoachV3__actions">
            <Button className="bcServiceV3__button bcServiceV3__button--primary" variant="primary" onClick={onOpenCoach}>Открыть AI-Coach <span aria-hidden="true">↗</span></Button>
            <Button className="bcServiceV3__button bcServiceV3__button--secondary" variant="ghost" onClick={onOpenSupport}>Поддержка</Button>
          </div>
        </div>
      </GlassSurface>
    </section>
  );
}

export default AICoachV3;
