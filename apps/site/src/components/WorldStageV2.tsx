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
  const isReactor = tone === "reactor";
  const visualPointer = reverse ? (isReactor ? -5 : -7) : isReactor ? 5 : 7;
  const imagePointer = reverse ? (isReactor ? -9 : -13) : isReactor ? 9 : 13;
  const visualDepth = isReactor ? 25 : 19;
  const imageDepth = isReactor ? 38 : 31;
  const visualRotate = isReactor ? 0.3 : 0.42;
  const imageRotate = isReactor ? 0.2 : 0.28;

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
        data-bc-parallax-depth={isReactor ? "8" : "10"}
        data-bc-parallax-pointer={reverse ? "-2" : "2"}
        data-bc-parallax-rotate={isReactor ? "0.08" : "0.12"}
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
        data-bc-parallax-depth={String(visualDepth)}
        data-bc-parallax-pointer={String(visualPointer)}
        data-bc-parallax-rotate={String(visualRotate)}
        data-bc-parallax-scale={isReactor ? "0.005" : "0.007"}
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
          data-bc-parallax-depth={String(imageDepth)}
          data-bc-parallax-pointer={String(imagePointer)}
          data-bc-parallax-rotate={String(imageRotate)}
          data-bc-parallax-scale={isReactor ? "0.011" : "0.014"}
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
