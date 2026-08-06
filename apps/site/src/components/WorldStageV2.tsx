import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import "../styles/world-stage-v2.css";

export type WorldStageV2Tone = "ocean" | "reactor";

export type WorldStageV2Props = {
  index: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  imageSrc: string;
  imageAlt: string;
  tone: WorldStageV2Tone;
  reverse?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function WorldStageV2({
  index,
  title,
  subtitle,
  description,
  status,
  imageSrc,
  imageAlt,
  tone,
  reverse = false,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: WorldStageV2Props) {
  return (
    <article
      className="bcWorldStageV2"
      data-tone={tone}
      data-reverse={reverse ? "true" : "false"}
      aria-labelledby={`bc-world-v2-${index}`}
    >
      <div className="bcWorldStageV2__copy">
        <div className="bcWorldStageV2__meta">
          <span>{index}</span>
          <span>BLACKCROWN WORLD</span>
          <strong>{status}</strong>
        </div>

        <h2 id={`bc-world-v2-${index}`}>{title}</h2>
        <p className="bcWorldStageV2__subtitle">{subtitle}</p>
        <p className="bcWorldStageV2__description">{description}</p>

        <div className="bcWorldStageV2__actions">
          <Button variant="primary" leftIconSrc={Icons.play} onClick={onPrimary}>
            {primaryLabel}
          </Button>
          {secondaryLabel && onSecondary ? (
            <Button variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bcWorldStageV2__visual">
        <div className="bcWorldStageV2__reactor" aria-hidden="true" />
        <div className="bcWorldStageV2__scan" aria-hidden="true" />
        <div className="bcWorldStageV2__particles" aria-hidden="true" />
        <img src={imageSrc} alt={imageAlt} loading="lazy" />
        <div className="bcWorldStageV2__overlay" aria-hidden="true" />
        <div className="bcWorldStageV2__frame" aria-hidden="true" />
        <span className="bcWorldStageV2__coordinate" aria-hidden="true">
          WORLD / {index}
        </span>
      </div>
    </article>
  );
}

export default WorldStageV2;
