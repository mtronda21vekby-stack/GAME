import React from "react";
import type { SceneId } from "../types";

type SceneLayerProps = {
  id: SceneId;
  active: boolean;
  reducedMotion: boolean;
  tone?: string;
  children: React.ReactNode;
};

type SceneStyle = React.CSSProperties & {
  "--cx-scene-opacity": string;
  "--cx-scene-local": string;
  "--cx-scene-shift": string;
  "--cx-scene-scale": string;
  "--cx-scene-depth": string;
};

export function SceneLayer({ id, active, reducedMotion, tone, children }: SceneLayerProps) {
  const accessible = active || reducedMotion;
  const style: SceneStyle = {
    "--cx-scene-opacity": `var(--cx-${id}-opacity, ${id === "crown" ? 1 : 0})`,
    "--cx-scene-local": `var(--cx-${id}-local, 0)`,
    "--cx-scene-shift": `var(--cx-${id}-shift, 0px)`,
    "--cx-scene-scale": `var(--cx-${id}-scale, 1)`,
    "--cx-scene-depth": `var(--cx-${id}-depth, 0px)`,
  };
  const inertProps = accessible
    ? {}
    : ({ inert: "" } as unknown as React.HTMLAttributes<HTMLElement>);

  return (
    <article
      className={`bcCinematic__scene bcCinematic__scene--${id}`}
      data-scene={id}
      data-active={active ? "true" : "false"}
      data-tone={tone}
      aria-hidden={accessible ? undefined : true}
      style={style}
      {...inertProps}
    >
      {children}
    </article>
  );
}
