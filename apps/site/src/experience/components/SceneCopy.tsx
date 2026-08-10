import React from "react";
import type { SceneId } from "../types";

type SceneCopyProps = {
  scene: SceneId;
  eyebrow: string;
  title: string;
  body: string;
  hero?: boolean;
  align?: "left" | "right";
  children?: React.ReactNode;
};

type CopyStyle = React.CSSProperties & { "--cx-copy-opacity": string };

export function SceneCopy({ scene, eyebrow, title, body, hero, align = "left", children }: SceneCopyProps) {
  const Heading = hero ? "h1" : "h2";
  const style: CopyStyle = { "--cx-copy-opacity": `var(--cx-${scene}-copy, ${scene === "crown" ? 1 : 0})` };

  return (
    <div className="bcCinematic__copy" data-align={align} style={style}>
      <span className="bcCinematic__eyebrow">{eyebrow}</span>
      <Heading>{title}</Heading>
      <p>{body}</p>
      {children ? <div className="bcCinematic__actions">{children}</div> : null}
    </div>
  );
}
