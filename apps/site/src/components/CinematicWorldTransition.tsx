import React from "react";
import "../styles/cinematic-world-transition.css";

export type CinematicWorldTransitionTone = "ocean" | "reactor";

export type CinematicWorldTransitionProps = {
  tone: CinematicWorldTransitionTone;
  index: string;
  title: string;
  detail: string;
};

export function CinematicWorldTransition({
  tone,
  index,
  title,
  detail,
}: CinematicWorldTransitionProps) {
  return (
    <div
      className="bcWorldTransition"
      data-tone={tone}
      data-bc-transition={tone}
      aria-hidden="true"
    >
      <div className="bcWorldTransition__depth" />
      <div className="bcWorldTransition__energy" />
      <div className="bcWorldTransition__veil" />
      <div className="bcWorldTransition__particles" />

      <div className="bcWorldTransition__label">
        <span>WORLD GATE / {index}</span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

export default CinematicWorldTransition;
