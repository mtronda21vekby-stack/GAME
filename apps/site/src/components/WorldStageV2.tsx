import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import ReactorFX from "./ReactorFX";
import "../styles/world-stage-v2.css";
import "../styles/v3-4-world-visual.css";

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
  const reactorTone = tone === "reactor" ? "orange" : "cyan";
  const visualPointer = reverse ? -8 : 8;
  const imagePointer = reverse ? -15 : 15;

  return (
    <article
      className="bcWorldStageV2"
      data-tone={tone}
      data-reverse={reverse ? "true" : "false"}
      aria-labelledby={`bc-world-v2-${index}`}
    >
      <div
        className="bcWorldStageV2__copy"
        data-bc-parallax
        data-bc-parallax-depth="10"
        data-bc-parallax-pointer={reverse ? "-2" : "2"}
        data-bc-parallax-rotate="0.12"
      >
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

      <div
        className="bcWorldStageV2__visual"
        data-bc-parallax
        data-bc-parallax-depth="22"
        data-bc-parallax-pointer={String(visualPointer)}
        data-bc-parallax-rotate="0.5"
        data-bc-parallax-scale="0.006"
      >
        <ReactorFX
          className="bcWorldStageV2__reactorFX"
          tone={reactorTone}
          size="large"
          intensity={tone === "reactor" ? 1.22 : 0.92}
        />
        <div className="bcWorldStageV2__reactor" aria-hidden="true" />
        <div className="bcWorldStageV2__scan" aria-hidden="true" />
        <div className="bcWorldStageV2__particles" aria-hidden="true" />
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          data-bc-parallax
          data-bc-parallax-depth="36"
          data-bc-parallax-pointer={String(imagePointer)}
          data-bc-parallax-rotate="0.34"
          data-bc-parallax-scale="0.014"
        />
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
